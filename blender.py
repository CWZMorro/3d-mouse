import bpy
import socket
import json

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
                    obj.rotation_euler[0] = msg.get('beta', 0) * (3.14159 / 180)
                    obj.rotation_euler[1] = msg.get('gamma', 0) * (3.14159 / 180)
                    obj.rotation_euler[2] = msg.get('alpha', 0) * (3.14159 / 180)
                    
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
        print("Blender connected to Port 5005")
        return {'RUNNING_MODAL'}

    def cancel(self, context):
        context.window_manager.event_timer_remove(self._timer)
        self._sock.close()
        print("Connection Closed")

def register():
    bpy.utils.register_class(WEB_OT_UDP_Receiver)

if __name__ == "__main__":
    register()
    bpy.ops.wm.udp_receiver()