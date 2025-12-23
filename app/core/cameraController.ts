import * as THREE from "three";

type CameraTarget = "system" | "earth" | "moon";

class CameraController {
    snapping = false;
    target: CameraTarget = "system";

    targetPosition = new THREE.Vector3();
    lookAtPosition = new THREE.Vector3();

    systemPos = new THREE.Vector3(0, 0, 8);
    earthOffset = new THREE.Vector3(0, 0, 3);
    moonOffset = new THREE.Vector3(0, 0, 1.8);

    startSnap(target: CameraTarget, worldPos: THREE.Vector3) {
        this.target = target;
        this.snapping = true;

        this.lookAtPosition.copy(worldPos);

        const offset =
            target === "earth" ? this.earthOffset :
                target === "moon" ? this.moonOffset :
                    new THREE.Vector3();

        this.targetPosition.copy(worldPos).add(offset);
    }

    snapToSystem() {
        this.target = "system";
        this.snapping = true;
        this.targetPosition.copy(this.systemPos);
        this.lookAtPosition.set(0, 0, 0);
    }

    stopSnap() {
        this.snapping = false;
    }
}

export const cameraController = new CameraController();
