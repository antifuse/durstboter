import {Entity, PrimaryGeneratedColumn, Column, BaseEntity, PrimaryColumn, ManyToMany, JoinTable, JoinColumn} from "typeorm";
import { JoinAttribute } from "typeorm/query-builder/JoinAttribute";


@Entity()
export class Guild extends BaseEntity{

    constructor(id: string) {
        super();
        this.id = id;
        this.activatedCogs = [];
    }

    @PrimaryColumn()
    id: string;

    @Column({default: "€"})
    prefix: string;

    @Column({type:"simple-array"})
    activatedCogs: string[];
    
}
