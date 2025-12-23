import * as THREE from "three";

class CameraController {
    target: "system" | "earth" | "moon" = "system";
    snapping = false;

    systemPos = new THREE.Vector3(0, 0, 8);
    earthOffset = new THREE.Vector3(0, 0, 3);
    moonOffset = new THREE.Vector3(0, 0, 1.8);

    setTarget(target: "system" | "earth" | "moon") {
        this.target = target;
        this.snapping = true; // start snap
    }

    stopSnap() {
        this.snapping = false;
    }
}

export const cameraController = new CameraController();
