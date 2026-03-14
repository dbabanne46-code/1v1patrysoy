const VANDAL_PATTERN = [
    {x: 0, y: 0.1}, {x: 0, y: 0.2}, {x: 0.05, y: 0.3}, // Climb
    {x: -0.1, y: 0.3}, {x: 0.1, y: 0.3}              // Sway
];
// On every shot, increment patternIndex and apply these offsets to camera.pitch/yaw