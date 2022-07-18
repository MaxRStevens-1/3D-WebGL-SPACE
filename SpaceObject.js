export class SpaceObject {
    /**
     * 
     * @param {int} index 
     * @param {float} rotation_speed 
     * @param {float} orbit_speed 
     * @param {float} orbit_radius 
     * @param {int} orbit_theta 
     * @param {float} radius 
     * @param {SpaceObject} parent 
     * @param {String} name 
     */
    constructor (index, rotation_speed, orbit_speed, orbit_radius, 
        orbit_theta, radius, parent, name, mass, tilt, texture_name) {
            this.index = index
            this.rotation_speed = rotation_speed
            this.orbit_speed = orbit_speed
            this.orbit_radius = orbit_radius
            this.orbit_theta = orbit_theta
            this.parent = parent
            this.radius = radius
            this.mass = mass
            this.satellites = []
            this.num_satellites = 0
            this.name = name
            this.tilt = tilt
            this.satellite_map = new Map()
            this.soi = 0
        }

    /**
     * adds satelite to satellites array
     * @param {SpaceObject} space_obj 
     */
    addSatellite (space_obj) {
        this.satellites.push (space_obj)
        this.num_satellites += 1
    }
    /**
     * returns satellite at index
     * @param {int} index 
     * @returns 
     */
    getSatellite (index) {return this.satellites[index]}


    /**
     * returns child satellite at normally used index
     * @param {SpaceObject} index 
     * @returns 
     */
    getChild (index) {return this.satellite_map.get(index)}

    /**
     * Depth first iterator
     */
    [Symbol.iterator] () {
        let current_parent = this
        let next_obj = 0
        let previous_idxs = []
        let children = this.satellites
        return {
            next: () => {
                let result = {value: null, done: true}
                if (current_parent.parent != null && next_obj >= children.length) {
                    current_parent = current_parent.parent
                    children = current_parent.satellites
                    next_obj = previous_idxs.pop()
                }
                if (next_obj < children.length) {
                    let current_child = children[next_obj]
                    result = {value: current_child, done: false}
                    next_obj++
                    if (current_child.num_satellites > 0) {
                        current_parent = current_child
                        children = current_parent.satellites
                        previous_idxs.push (next_obj)
                        next_obj = 0
                    }
                } 
                
                return result
            }
        }
    }
}