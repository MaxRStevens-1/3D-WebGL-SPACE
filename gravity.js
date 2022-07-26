import { checkSphereDistance } from './sphere'
import { TrimeshVaoGrouping } from './trimesh'
import { Matrix4 } from './matrix'
/**
 * Moves player by the gravity of specified object.
 * @param {SpaceObject} object 
 * @param {float} distance 
 * @param {TrimeshVaoGrouping} trivao_group 
 * @param {Vector3} ship_center 
 * @param {float} scale
 * @param {PlayerObject} player
 */
 function movePlayerByGravity (object, distance, trivao_group, ship_center, scale, player) {
    // calculate force of gravity
    distance = distance * (1/scale)
    let force = forceOfGravity (distance, object.mass, scale)  
    // calculate unit vector between pointing from ship to sphere
    // B - A / | B - A |
    let sphere_center = trivao_group.buildMatrix (object.index)
      .multiplyVector (trivao_group.centroid).xyz
    let gravity_direction = sphere_center.add(ship_center.inverse())
      .normalize().scalarMultiply(force)
    player.addVelocity (gravity_direction)
}

/**
 * Guesstimate of gravitational force by reconverting force from unit 
 * earth radii back to miles
 * @param {float} distance 
 * @param {float} mass_impact 
 * @param {float} radius
 * @returns rough force of gravity float
 */
 function forceOfGravity (distance, mass, scale) {
    let force = (mass)/Math.pow(distance,2) * scale 
    return force
} 



/**
 * updates gravity for all SpaceObjects.
 * only updates player IF player within Object Sphere of Influence
 * @param {SpaceObject} parent 
 * @param {TriVaoGrouping}
 * @param {Trimesh} ship 
 * @param {Matrix4} ship_position
 * @param {Vector3} ship_center
 * @param {TrimeshVaoGrouping} bodies
 * @param {float} scale
 * @param {PlayerObject} player
*/
 export function gravityUpdate (object, trivao_group, ship, ship_position,
     ship_center, bodies, scale, player) {
    let objectWithinDistance = null
    let withinDistance = -1
    if (object.num_satellites > 0 && object.satellites != null) {
      for (let i = 0; i < object.num_satellites; i++) {
        let sat = object.getSatellite (i)
        let withinObject = gravityUpdate (sat, trivao_group, ship, ship_position, ship_center,
            bodies, scale, player)
        if (withinObject != null) {
          objectWithinDistance = withinObject[0]
          withinDistance = withinObject[1]
        }
      }
    }
    let distance = Math.max(checkSphereDistance (object.index, ship_center, bodies),
     object.radius/3)
    if (object.parent == null) {
      if (withinDistance == -1)
        withinDistance = distance
      if (objectWithinDistance == null)
        objectWithinDistance = object
      movePlayerByGravity (objectWithinDistance, withinDistance,
        trivao_group, ship_center, scale, player)
    }
    if (distance < object.soi)
      return [object, distance]
    if (objectWithinDistance != null)
      return [objectWithinDistance, withinDistance]
    return null
  }
  