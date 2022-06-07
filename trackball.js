import { Matrix4 } from "./matrix";
import { Vector3, Vector4 } from "./vector";

export class Trackball {

    constructor() {
        this.mouseSphere0 = null;
        this.previousRotations = Matrix4.identity();
        this.currentRotation = Matrix4.identity();
        this.viewport = [0, 0]
    }

    getCurrentMatrix() {
        return this.currentRotation;
    }

    setViewPort(width, height) {
        this.viewport[0] = width;
        this.viewport[1] = height;
    }

    pixelsToSphere(mousePixels) {
        const mouseNormalized = [mousePixels[0] / this.viewport[0] * 2 - 1,
                                 mousePixels[1] / this.viewport[1] * 2 - 1]
        const z2 = 1 - Math.pow(mouseNormalized[0],2) - Math.pow(mouseNormalized[1], 2)
        let mouseSphere = new Vector3(mouseNormalized[0], mouseNormalized[1], z2)
        if (z2 >= 0) {
            mouseSphere.z = Math.pow(z2, 0.5); 
        } else {
            mouseSphere = mouseSphere.normalize()
        }
        return mouseSphere;
    }

    start(mousePixels) {
        this.mouseSphere0 = this.pixelsToSphere(mousePixels)
    }

    drag(mousePixels, multiplier) {
        const mouseSphere = this.pixelsToSphere(mousePixels)
        const dot = this.mouseSphere0.dot(mouseSphere)
        if (Math.abs(dot) <= 1) {
            const radians = Math.acos(dot) * multiplier
            const axis = this.mouseSphere0.cross(mouseSphere).normalize()
            const v4Axis = new Vector4();
            v4Axis.setall(axis.x, axis.y, axis.z, 1)
            const currentMatrix = Matrix4.rotateAroundAxis(v4Axis, radians * (180 / Math.PI))
            const matrix = currentMatrix.multiplyMatrix(this.previousRotations) 
            this.currentRotation = matrix;
            return matrix;
        }
    }

    end() {
        this.previousRotations = this.currentRotation;
        this.mouseSphere0 = null;
    }

    cancel() {
        this.currentRotation = this.previousRotations;
        this.mouseSphere0 = null
    }
}