import {Entity, Column, BaseEntity, PrimaryColumn} from "typeorm";


@Entity()
export class User extends BaseEntity {

    constructor(id: string) {
        super();
        this.id = id;
    }

    @PrimaryColumn()
    id: string;

    @Column()
    fmname: string;
    
}
