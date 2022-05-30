import { Trimesh } from './trimesh';
import {Vector3} from './vector';


export class Terrain {

    constructor (elevations, width, depth) {
        this.elevations = elevations;
        this.width = width;
        this.depth = depth;
    }

    get(x, z) {
        return this.elevations[z * this.width + x];
    }

    set(x, z, elevation) {
        this.elevations[z * this.width + x] = this.elevation;
    }

    toTrimesh() {
        const positions = [];
        const texPositions = [];

        for (let z = 0; z < this.depth; z++) {
            for (let x = 0; x < this.width; x++) {
                let y = this.get(x, z)
                let vec3 = new Vector3(x, y, z)
                positions.push(vec3)
                texPositions.push(new Vector3(z / this.depth, x / this.width, 0))
            }
        }

        const faces = [];
        for (let z = 0; z < this.depth - 1; z++) {
            let nextZ = z + 1;
            for (let x = 0; x < this.width - 1; x++) {
                let nextX = x + 1
                let face1 = new Vector3(z * this.width + x,
                                            z * this.width + nextX,
                                            nextZ * this.width + x);
                let face2 = new Vector3(z * this.width + nextX,
                                        nextZ * this.width + nextX,
                                        nextZ * this.width + x)
                faces.push(face1)
                faces.push(face2)
            }
        }
        const trimesh = new Trimesh(positions, [], faces, texPositions)
        return trimesh
    }

    lerp(t, start, end) {
        return start + t*(end - start)
    }

    blerp(x, z) {
        try {
            this.get(x, z)
        } catch (error) {
            return null
        }

        const floorX = Math.floor(x);
        const floorZ = Math.floor(z);
        const fractionX = x - floorX
        const fractionZ = z - floorZ

        const nearLeft = this.get(floorX, floorZ)
        const nearRight = this.get(floorX + 1, floorZ)
        const nearMix = this.lerp(fractionX, nearLeft, nearRight)

        const farLeft = this.get(floorX, floorZ + 1)
        const farRight = this.get(floorX + 1, floorZ + 1)
        const farMix = this.lerp(fractionX, farLeft, farRight)

        return this.lerp(fractionZ, nearMix, farMix)
    }
}