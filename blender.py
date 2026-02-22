import bpy
import socket
import json
import math
import mathutils


class WEB_OT_UDP_Receiver(bpy.types.Operator):
    bl_idname = "wm.udp_receiver"
    bl_label = "UDP Receiver"

    _timer = None
    _sock = None

    _center_alpha = None
    _center_beta = None
    _center_gamma = None
    _deadzone = 8.0

    def get_shortest_angle_diff(self, target, current):
        """Forces the angle difference to take the shortest path (-180 to 180) to fix the 360 wraparound."""
        return (target - current + 180) % 360 - 180

    def apply_deadzone(self, diff, deadzone):
        """Smoothly clamps values within the deadzone to 0."""
        if diff > deadzone:
            return diff - deadzone
        elif diff < -deadzone:
            return diff + deadzone
        else:
            return 0.0

    def modal(self, context, event):
        if event.type == "TIMER":
            try:
                data, addr = self._sock.recvfrom(1024)
                msg = json.loads(data.decode())

                rv3d = None
                for area in context.screen.areas:
                    if area.type == "VIEW_3D":
                        rv3d = area.spaces.active.region_3d
                        break

                if rv3d:
                    mode = msg.get("mode", "rotate")

                    alpha = msg.get("alpha", 0)
                    beta = msg.get("beta", 0)
                    gamma = msg.get("gamma", 0)

                    if self._center_alpha is None or msg.get("reset", False):
                        self._center_alpha = alpha
                        self._center_beta = beta
                        self._center_gamma = gamma
                        return {"PASS_THROUGH"}

                    # 1. Calculate the true shortest difference to fix the wraparound glitch
                    raw_diff_alpha = self.get_shortest_angle_diff(
                        alpha, self._center_alpha
                    )
                    raw_diff_beta = self.get_shortest_angle_diff(
                        beta, self._center_beta
                    )
                    raw_diff_gamma = self.get_shortest_angle_diff(
                        gamma, self._center_gamma
                    )

                    # 2. Apply the smooth deadzone
                    diff_alpha = self.apply_deadzone(raw_diff_alpha, self._deadzone)
                    diff_beta = self.apply_deadzone(raw_diff_beta, self._deadzone)
                    diff_gamma = self.apply_deadzone(raw_diff_gamma, self._deadzone)

                    # 3. Sensitivity scaling
                    speed_x = msg.get("sensX", 50) / 2000.0
                    speed_y = msg.get("sensY", 50) / 2000.0

                    # Optional: Reduce the 'fidget spinner' (alpha) axis speed specifically
                    # Set this below 1.0 if the horizontal turning still feels too sensitive
                    alpha_speed_reducer = 0.6

                    if mode == "rotate":
                        current_eul = rv3d.view_rotation.to_euler("XYZ")

                        current_eul.x += diff_beta * speed_y * (math.pi / 180)
                        current_eul.y += diff_gamma * speed_x * (math.pi / 180)
                        current_eul.z += (
                            diff_alpha * speed_x * alpha_speed_reducer
                        ) * (math.pi / 180)

                        rv3d.view_rotation = current_eul.to_quaternion()

                    elif mode == "zoom":
                        zoom_velocity = diff_beta * speed_y * 0.5
                        rv3d.view_distance -= zoom_velocity
                        rv3d.view_distance = max(0.5, min(rv3d.view_distance, 500.0))

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

        self._center_alpha = None
        self._center_beta = None
        self._center_gamma = None

        self._timer = context.window_manager.event_timer_add(
            0.01, window=context.window
        )
        context.window_manager.modal_handler_add(self)
        print("Blender listening on Port 5005")
        return {"RUNNING_MODAL"}

    def cancel(self, context):
        context.window_manager.event_timer_remove(self._timer)
        if self._sock:
            self._sock.close()
        print("UDP Receiver Stopped")


def register():
    bpy.utils.register_class(WEB_OT_UDP_Receiver)


if __name__ == "__main__":
    register()
    bpy.ops.wm.udp_receiver()
