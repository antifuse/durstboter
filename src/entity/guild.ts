/**
 * @module Guild 
 */
import {Entity, Column, BaseEntity, PrimaryColumn} from "typeorm";


@Entity()
/**
 * The database's guild model.
 */
export class Guild extends BaseEntity{

    constructor(id: string) {
        super();
        this.id = id;
        this.activatedCogs = [];
        this.brettExcluded = [];
    }

    @PrimaryColumn()
    id: string;

    @Column({default: "€"})
    prefix: string;

    @Column({type:"simple-array"})
    activatedCogs: string[];

    @Column({nullable: true})
    brettChannel: string;

    @Column({nullable: true})
    brettThreshold: number; 

    @Column({type: "simple-array", nullable: true})
    brettExcluded: string[];

}
export default Guild;