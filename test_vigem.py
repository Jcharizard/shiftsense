import vgamepad as vg
import time

try:
    print("Initializing ViGEmBus controller...")
    gamepad = vg.VX360Gamepad()
    print("Success! Controller spawned.")
    print("Pressing A button and updating axes...")

    for _ in range(5):
        gamepad.press_button(button=vg.XUSB_BUTTON.XUSB_GAMEPAD_A)
        gamepad.left_joystick(x_value=32767, y_value=0)
        gamepad.right_trigger(value=255)
        gamepad.update()
        print("Pressed")
        time.sleep(0.5)

        gamepad.release_button(button=vg.XUSB_BUTTON.XUSB_GAMEPAD_A)
        gamepad.left_joystick(x_value=0, y_value=0)
        gamepad.right_trigger(value=0)
        gamepad.update()
        print("Released")
        time.sleep(0.5)

    print("Test complete.")
    
except Exception as e:
    print(f"FAILED TO LOAD VIGEM: {e}")
