const V = require('vigemclient');
const client = new V();

console.log("Connecting client...");
let err = client.connect();
if (err) {
    console.error("Client connect failed:", err);
    process.exit(1);
}

console.log("Creating X360 Controller...");
const c = client.createX360Controller();
err = c.connect();
if (err) {
    console.error("Controller connect failed:", err);
    process.exit(1);
}

console.log("Controller connected successfully! Emitting pulsing events on 'A' button...");

setInterval(() => {
    c.button.A.setValue(true);
    c.update();
    console.log("Button A Pressed (true)");
    setTimeout(() => {
        c.button.A.setValue(false);
        c.update();
        console.log("Button A Released (false)");
    }, 500);
}, 1000);
