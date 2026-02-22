import bpy
import socket
import json
import math

class WEB_OT_UDP_Receiver(bpy.types.Operator):
    bl_idname = "wm.udp_receiver"
    bl_label = "UDP Receiver"
    
    _timer = None
    _sock = None

    def modal(self, context, event):
        if event.type == 'TIMER':
            try:
                data, addr = self._sock.recvfrom(1024)
                msg = json.loads(data.decode())
                
                obj = context.active_object
                if obj:
                    mode = msg.get('mode', 'rotate')
                    
                    # Convert degrees to radians
                    alpha = msg.get('alpha', 0) * (math.pi / 180)
                    beta = msg.get('beta', 0) * (math.pi / 180)
                    gamma = msg.get('gamma', 0) * (math.pi / 180)
                    
                    # Sensitivity scaling (adjusting 1-100 slider range to usable multiplier)
                    sens_x = msg.get('sensX', 50) / 50.0
                    sens_y = msg.get('sensY', 50) / 50.0

                    if mode == 'rotate':
                        obj.rotation_euler[0] = beta * sens_y
                        obj.rotation_euler[1] = gamma
                        obj.rotation_euler[2] = alpha * sens_x
                    
                    elif mode == 'zoom':
                        # Use beta (forward/back tilt) for uniform scaling
                        # Base scale of 1.0 plus tilt influence
                        scale_val = 1.0 + (msg.get('beta', 0) / 45.0) * sens_y
                        # Clamp scale to prevent negative or extreme sizes
                        scale_val = max(0.1, min(scale_val, 10.0))
                        obj.scale = (scale_val, scale_val, scale_val)
                        
            except (socket.error, json.JSONDecodeError):
                pass 

        if event.type in {'ESC'}:
            self.cancel(context)
            return {'CANCELLED'}

        return {'PASS_THROUGH'}

    def execute(self, context):
        self._sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self._sock.bind(('127.0.0.1', 5005))
        self._sock.setblocking(False)
        
        self._timer = context.window_manager.event_timer_add(0.01, window=context.window)
        context.window_manager.modal_handler_add(self)
        print("Blender listening on Port 5005")
        return {'RUNNING_MODAL'}

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