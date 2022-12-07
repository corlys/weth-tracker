module.exports = class Data1670379334764 {
    name = 'Data1670379334764'

    async up(db) {
        await db.query(`CREATE TABLE "weth" ("id" character varying NOT NULL, "deposit" text, "withdraw" text, "total_suppy" text, CONSTRAINT "PK_1ffa904408e94842bddfffcdcf9" PRIMARY KEY ("id"))`)
    }

    async down(db) {
        await db.query(`DROP TABLE "weth"`)
    }
}
