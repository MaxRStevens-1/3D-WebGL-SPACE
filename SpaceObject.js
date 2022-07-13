export class SpaceObject {
    /**
     * 
     * @param {int} index 
     * @param {float} rotation_speed 
     * @param {float} orbit_speed 
     * @param {float} orbit_radius 
     * @param {int} orbit_theta 
     * @param {float} diameter 
     * @param {SpaceObject} parent 
     * @param {String} name 
     */
    constructor (index, rotation_speed, orbit_speed, orbit_radius, 
        orbit_theta, diameter, parent, name) {
            this.index = index
            this.rotation_speed = rotation_speed
            this.orbit_speed = orbit_speed
            this.orbit_radius = orbit_radius
            this.orbit_theta = orbit_theta
            this.parent = parent
            this.diameter = diameter
            this.satellites = []
            this.num_satellites = 0
            this.name = name
            this.satellite_map = new Map()
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
}