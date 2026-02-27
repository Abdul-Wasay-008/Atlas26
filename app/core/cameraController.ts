import * as THREE from "three";

type CameraTarget = "system" | "sun" | "mercury" | "venus" | "earth" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "moon" | "phobos" | "iss" | "hubble";

class CameraController {
    snapping = false;
    target: CameraTarget = "system";
    snapCompleted = false; // Track if snap has completed
    userInteracting = false; // Track if user is actively controlling camera
    snapDisabled = false; // Permanent flag - once user interacts, disable snapping until new object clicked
    isResetting = false; // Track if this is a reset animation (slower, smoother)

    targetPosition = new THREE.Vector3();
    lookAtPosition = new THREE.Vector3();

    systemPos = new THREE.Vector3(0, 16, 32); // Lower elevation, zoomed out to fit all planets
    sunOffset = new THREE.Vector3(0, 0, 4); // Reduced for smaller Sun
    mercuryOffset = new THREE.Vector3(0, 0, 2);
    venusOffset = new THREE.Vector3(0, 0, 3);
    earthOffset = new THREE.Vector3(0, 0, 3);
    marsOffset = new THREE.Vector3(0, 0, 3);
    jupiterOffset = new THREE.Vector3(0, 0, 5);
    saturnOffset = new THREE.Vector3(0, 0, 5);
    uranusOffset = new THREE.Vector3(0, 0, 4);
    neptuneOffset = new THREE.Vector3(0, 0, 4);
    moonOffset = new THREE.Vector3(0, 0, 1.8);
    phobosOffset = new THREE.Vector3(0, 0, 0.2); // Close-up offset for small moon
    issOffset = new THREE.Vector3(0, 0, 0.5); // Close-up offset for satellites
    hubbleOffset = new THREE.Vector3(0, 0, 0.5); // Close-up offset for satellites

    startSnap(target: CameraTarget, worldPos: THREE.Vector3) {
        // If snapping is disabled (user interacted), completely block all snaps
        if (this.snapDisabled) {
            return;
        }

        const previousTarget = this.target;

        // If user is interacting, only allow snapping to a DIFFERENT target
        // This prevents re-snapping to the same object after user moves camera
        if (this.userInteracting) {
            // Only allow snap if it's a different target (user clicked new object)
            if (previousTarget === target) {
                // Same target and user is interacting - don't snap
                return;
            }
            // Different target - reset flags to allow snap
            this.userInteracting = false;
            this.snapDisabled = false;
        }

        // Reset flags for new snap
        this.target = target;
        this.snapping = true;
        this.snapCompleted = false;

        this.lookAtPosition.copy(worldPos);

        const offset =
            target === "sun" ? this.sunOffset :
                target === "mercury" ? this.mercuryOffset :
                    target === "venus" ? this.venusOffset :
                        target === "earth" ? this.earthOffset :
                            target === "mars" ? this.marsOffset :
                                target === "jupiter" ? this.jupiterOffset :
                                    target === "saturn" ? this.saturnOffset :
                                        target === "uranus" ? this.uranusOffset :
                                            target === "neptune" ? this.neptuneOffset :
                                                target === "moon" ? this.moonOffset :
                                                    target === "phobos" ? this.phobosOffset :
                                                        target === "iss" ? this.issOffset :
                                                            target === "hubble" ? this.hubbleOffset :
                                                                new THREE.Vector3();

        this.targetPosition.copy(worldPos).add(offset);
    }

    snapToSystem() {
        // Always allow snapping to system (reset button)
        this.target = "system";
        this.snapping = true;
        this.snapCompleted = false;
        this.userInteracting = false;
        this.snapDisabled = false;
        this.isResetting = true; // Mark as reset animation for slower, smoother movement
        this.targetPosition.copy(this.systemPos);
        this.lookAtPosition.set(0, 0, 0);
    }

    stopSnap() {
        this.snapping = false;
        this.snapCompleted = true;
        this.isResetting = false; // Reset flag when snap completes
    }

    setUserInteracting(interacting: boolean) {
        this.userInteracting = interacting;
        // Once user interacts, permanently disable snapping until new object is clicked
        if (interacting) {
            this.snapDisabled = true;
            this.stopSnap(); // Stop any ongoing snap
        }
    }

    // Reset snap disabled flag when user clicks a new object
    resetSnapDisabled() {
        this.snapDisabled = false;
        this.userInteracting = false;
    }
}

export const cameraController = new CameraController();
