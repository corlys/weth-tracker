module.exports = class Data1670394150934 {
    name = 'Data1670394150934'

    async up(db) {
        await db.query(`CREATE TABLE "weth" ("id" character varying NOT NULL, "deposit" text, "withdraw" text, "total_suppy" text, CONSTRAINT "PK_1ffa904408e94842bddfffcdcf9" PRIMARY KEY ("id"))`)
    }

    async down(db) {
        await db.query(`DROP TABLE "weth"`)
    }
}
