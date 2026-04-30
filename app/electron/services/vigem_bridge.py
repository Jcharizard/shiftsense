import vgamepad as vg
import sys
import json
import time
import threading

gamepad = None

def init_gamepad():
    global gamepad
    try:
        gamepad = vg.VX360Gamepad()
        print("READY", flush=True)
    except Exception as e:
        print(f"ERROR: {e}", flush=True)
        sys.exit(1)

_gamepad_lock = threading.Lock()

def tap_worker(button_name, duration_ms):
    """Runs in its own thread so the sleep doesn't block the message loop."""
    if not gamepad:
        return
    try:
        btn = getattr(vg.XUSB_BUTTON, button_name, None)
        if btn:
            with _gamepad_lock:
                gamepad.press_button(button=btn)
                gamepad.update()
            time.sleep(duration_ms / 1000.0)
            with _gamepad_lock:
                gamepad.release_button(button=btn)
                gamepad.update()
        else:
            sys.stderr.write(f"[vigem_bridge] Unknown button: {button_name}\n")
            sys.stderr.flush()
    except Exception as e:
        sys.stderr.write(f"[vigem_bridge] tap_worker error: {e}\n")
        sys.stderr.flush()

def process_messages():
    """
    Single-threaded message loop. Axes are applied inline — no extra threads,
    no GIL contention with vgamepad's ctypes C extension. At the 30fps throttle
    rate set by Node.js, gamepad.update() easily keeps up.
    """
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            data = json.loads(line)
            req_type = data.get("type")

            if req_type == "axes":
                if gamepad:
                    steer_val = float(data.get("steer", 0.0))
                    steer_joystick = data.get("steerJoystick", "left")

                    with _gamepad_lock:
                        if steer_joystick == "left":
                            gamepad.left_joystick_float(x_value_float=steer_val, y_value_float=0.0)
                            gamepad.right_joystick_float(x_value_float=0.0, y_value_float=0.0)
                        else:
                            gamepad.left_joystick_float(x_value_float=0.0, y_value_float=0.0)
                            gamepad.right_joystick_float(x_value_float=steer_val, y_value_float=0.0)

                        gamepad.right_trigger_float(value_float=float(data.get("gas",   0.0)))
                        gamepad.left_trigger_float( value_float=float(data.get("brake",  0.0)))
                        gamepad.update()

            elif req_type == "tap":
                button   = data.get("button")
                duration = data.get("durationMs", 100)
                threading.Thread(
                    target=tap_worker,
                    args=(button, duration),
                    daemon=True
                ).start()

        except json.JSONDecodeError as e:
            sys.stderr.write(f"[vigem_bridge] JSON error: {e}\n")
            sys.stderr.flush()
        except Exception as e:
            sys.stderr.write(f"[vigem_bridge] message error: {e}\n")
            sys.stderr.flush()

if __name__ == "__main__":
    init_gamepad()
    process_messages()
