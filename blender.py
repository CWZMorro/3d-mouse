import bpy
import socket
import json
import math
from mathutils import Vector, Matrix, Quaternion

class WEB_OT_UDP_Receiver(bpy.types.Operator):
    bl_idname = "wm.udp_receiver"
    bl_label = "UDP Receiver"

    _timer = None
    _sock = None
    _center_alpha = _center_beta = _center_gamma = None
    _deadzone = 8.0

    def get_shortest_angle_diff(self, target, current):
        return (target - current + 180) % 360 - 180

    def apply_deadzone(self, diff, deadzone):
        if abs(diff) > deadzone:
            return diff - (deadzone if diff > 0 else -deadzone)
        return 0.0

    def modal(self, context, event):
        if event.type == "TIMER":
            try:
                data, addr = self._sock.recvfrom(1024)
                msg = json.loads(data.decode())

                mode = msg.get("mode", "")
                touches = int(msg.get("touches") or 0)
                obj = context.active_object
                rv3d = next((area.spaces.active.region_3d for area in context.screen.areas if area.type == "VIEW_3D"), None)

                # --- Object-Relative Reset Logic ---
                if msg.get("reset", False):
                    self._center_alpha = self._center_beta = self._center_gamma = None
                    if rv3d:
                        # Snap rotation to upright
                        rv3d.view_rotation = Quaternion((1.0, 0.0, 0.0, 0.0))
                        # If an object is selected, move the camera's focus to it
                        if obj:
                            rv3d.view_location = obj.location.copy()
                        else:
                            rv3d.view_location = Vector((0, 0, 0))
                    return {"PASS_THROUGH"}

                inv_x = -1.0 if msg.get("invX") else 1.0
                inv_y = -1.0 if msg.get("invY") else 1.0

                dx = float(msg.get("dx") or 0.0) * inv_x
                dy = float(msg.get("dy") or 0.0) * inv_y
                zoomDelta = float(msg.get("zoomDelta") or 0.0) * inv_y
                twistDelta = float(msg.get("twistDelta") or 0.0)

                if mode == "viewport_touch" and rv3d:
                    if touches == 1:
                        yaw = Quaternion((0, 0, 1), dx * 0.01)
                        pitch = Quaternion(rv3d.view_rotation @ Vector((1, 0, 0)), dy * 0.01)
                        rv3d.view_rotation = yaw @ pitch @ rv3d.view_rotation
                    elif touches == 2:
                        rv3d.view_distance -= zoomDelta * 0.05
                        rv3d.view_distance = max(0.1, min(rv3d.view_distance, 500.0))
                        view_inv = rv3d.view_matrix.inverted()
                        rv3d.view_location += Vector(view_inv.col[0][:3]) * dx * 0.01
                        rv3d.view_location -= Vector(view_inv.col[1][:3]) * dy * 0.01

                elif mode == "object_touch" and obj:
                    if touches == 1:
                        rot_z = Matrix.Rotation(dx * 0.01, 4, 'Z')
                        view_inv = rv3d.view_matrix.inverted() if rv3d else Matrix()
                        rot_x = Matrix.Rotation(dy * 0.01, 4, view_inv.col[0][:3])
                        obj.matrix_world = rot_x @ rot_z @ obj.matrix_world
                    elif touches == 2:
                        scale_factor = 1.0 + (zoomDelta * 0.01)
                        obj.scale *= scale_factor
                        view_inv = rv3d.view_matrix.inverted() if rv3d else None
                        if view_inv:
                            obj.location += Vector(view_inv.col[0][:3]) * -dx * 0.02
                            obj.location += Vector(view_inv.col[1][:3]) * dy * 0.02

                elif mode == "gyro_control" and rv3d:
                    if touches == 2:
                        rv3d.view_distance -= zoomDelta * 0.05
                    
                    alpha, beta, gamma = msg.get("alpha", 0), msg.get("beta", 0), msg.get("gamma", 0)
                    if self._center_alpha is None:
                        self._center_alpha, self._center_beta, self._center_gamma = alpha, beta, gamma
                        return {"PASS_THROUGH"}

                    d_alpha = self.apply_deadzone(self.get_shortest_angle_diff(alpha, self._center_alpha), self._deadzone)
                    d_beta = self.apply_deadzone(self.get_shortest_angle_diff(beta, self._center_beta), self._deadzone) * inv_y
                    d_gamma = self.apply_deadzone(self.get_shortest_angle_diff(gamma, self._center_gamma), self._deadzone) * inv_x
                    
                    sx, sy = float(msg.get("sensX") or 50)/2000.0, float(msg.get("sensY") or 50)/2000.0
                    eul = rv3d.view_rotation.to_euler("XYZ")
                    eul.x += d_beta * sy * (math.pi/180)
                    eul.y += d_gamma * sx * (math.pi/180)
                    eul.z += (d_alpha * sx * 0.6) * (math.pi/180)
                    rv3d.view_rotation = eul.to_quaternion()

            except (socket.error, json.JSONDecodeError):
                pass
        if event.type in {"ESC"}:
            self.cancel(context)
            return {"CANCELLED"}
        return {"PASS_THROUGH"}

    def execute(self, context):
        self._sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self._sock.bind(("127.0.0.1", 5005))
        self._sock.setblocking(False)
        self._timer = context.window_manager.event_timer_add(0.01, window=context.window)
        context.window_manager.modal_handler_add(self)
        return {"RUNNING_MODAL"}

    def cancel(self, context):
        context.window_manager.event_timer_remove(self._timer)
        if self._sock: self._sock.close()

def register(): bpy.utils.register_class(WEB_OT_UDP_Receiver)
if __name__ == "__main__":
    register()
    bpy.ops.wm.udp_receiver()