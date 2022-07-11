export class SpaceObject {
    constructor (index, rotation_speed, orbit_speed, orbit_radius, 
        orbit_theta, parent) {
            this.index = index
            this.rotation_speed = rotation_speed
            this.orbit_speed = orbit_speed
            this.orbit_radius = orbit_radius
            this.orbit_theta = orbit_theta
            this.parent = parent
            this.satellites = []
            this.num_satellites = 0
            this.name = name
        }

    /**
     * adds satelite to satellites array
     * @param {SpaceObject} space_obj 
     */
    addSatellite (space_obj) {
        this.satellites.push (space_obj)
        this.num_satellites += 1
    }
    getSatellite (index) {return this.satellites[index]}

}