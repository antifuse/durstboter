import {Entity, Column, BaseEntity, PrimaryColumn} from "typeorm";


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

    @Column({nullable: true})
    brettChannel: string;

    @Column({nullable: true})
    brettThreshold: number; 
    
}
