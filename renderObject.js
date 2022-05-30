import { Matrix4 } from './matrix'
export class RenderObject {
    constructor(tri_vao, position, position_point, name, albedo) {
        this.tri_vao = tri_vao
        this.position = position
        this.position_point = position_point
        this.name = name
        this.collectable = false
        this.albedo = albedo
        this.last_rotation = "z+"
    }

}