import { Vector3 } from "./vector"
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

/**
 * parses an inputed text file, returns an formated space object list
 * format of txt should be
 * name,radius,Rotation_Speed,Orbit_speed,Orbit_Radius,Orbit_theta,Mass,Rotation X,Rotation Y,Rotation Z,Parent
 * A child should NEVER come parent in input text
 * @param {String} solarString 
 * @returns  array list of SpaceObjects
 */
 export function parseSolarMap (solarString) {
    solarString = solarString.replaceAll ('\r','')
    let split_objects = solarString.split ('\n')
    let object_map = new Map()
    let object_list = []
    for (let i = 0; i < split_objects.length; i++) {
      let split_attributes = split_objects[i].split (',')
      if (split_attributes.length != 12)
        continue
      // set strings to #'s
      for (let x = 1; x < split_attributes.length; x++) {
        if (x == 10)
          continue 
        split_attributes[x] = Number(split_attributes[x])
      }
      let tilt  = new Vector3 (split_attributes[7], split_attributes[8], 
        split_attributes[9])
      let parent = split_attributes[10]
      if (parent.length < 1 || parent == 'null')
        parent = null
      let current_object = new SpaceObject (i, split_attributes[2], 
        split_attributes[3], split_attributes[4], split_attributes[5], split_attributes[1],
        parent, split_attributes[0], split_attributes[6], tilt)
      if (current_object.parent != null) {
        object_map.get (current_object.parent).addSatellite (current_object)
        current_object.parent = object_map.get (current_object.parent)
      }
      object_list.push (current_object)
      object_map.set (current_object.name, current_object)
    }
    return object_list
  }


  /**
 * Sets parent obj and all chldrens index=>SpaceObject hash table.
 * done to not have to iterate though all children to get an specific child.
 * @param {SpaceObject} obj 
 * @returns the combined SpaceObject map
 */
export function setSatelliteHashTable (obj) {

    let local_map = new Map()
    if (obj.num_satellites != 0 && obj.satellites != null) {
      for (let i = 0; i < obj.num_satellites; i++) {
        let child = obj.getSatellite(i)
        local_map.set (child.index, child)
        if (child.num_satellites > 0) {
          let child_map = setSatelliteHashTable(child)
          local_map = new Map([...child_map, ...local_map])
        }
      }
    }
    local_map.set (obj.index, obj)
    obj.satellite_map = local_map
    return local_map
  } 