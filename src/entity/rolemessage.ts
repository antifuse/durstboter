import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class RoleMessage extends BaseEntity {

    constructor(message: string) {
        super();
        this.message = message;
        this.roles = [];
        this.emoji = [];
    }

    @PrimaryColumn()
    message: string;

    @Column({ type: "simple-array" })
    roles: string[];

    @Column({ type: "simple-array"})
    emoji: string[];
}
