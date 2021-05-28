import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class BrettMessage extends BaseEntity {

    constructor(message: string, brett: string) {
        super();
        this.original = message;
        this.brett = brett;
    }

    @PrimaryColumn()
    original: string;

    @Column()
    brett: string;
}
