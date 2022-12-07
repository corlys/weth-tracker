import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"

@Entity_()
export class Weth {
    constructor(props?: Partial<Weth>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("text", {nullable: true})
    deposit!: string | undefined | null

    @Column_("text", {nullable: true})
    withdraw!: string | undefined | null

    @Column_("text", {nullable: true})
    totalSuppy!: string | undefined | null
}
