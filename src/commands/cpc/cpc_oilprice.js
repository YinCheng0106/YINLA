const puppeteer = require('puppeteer');
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Colors } = require('discord.js');

async function fetchCPCOilPrice() {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        executablePath: '/usr/bin/google-chrome',
        args: ['--no-sandbox'],
    });
    const page = await browser.newPage();

    await page.goto('https://www.cpc.com.tw/', { waitUntil: 'networkidle2' });

    const OilData = await page.evaluate(() => {
        const date = document.querySelector('#t_PriceUpdate')?.textContent.trim();      // 調整日期
        const upsORdowns = document.querySelector('.sys')?.textContent.trim();          // 調降or調漲
        const rate = document.querySelector('.rate')?.textContent.trim();               // 調整幅度

        const nine_two_price = document.querySelector('.today_price_ct li:nth-child(1) .today_price_info .price')?.textContent.trim() || "無資料";
        const nine_five_price = document.querySelector('.today_price_ct li:nth-child(2) .today_price_info .price')?.textContent.trim() || "無資料";
        const nine_eight_price = document.querySelector('.today_price_ct li:nth-child(3) .today_price_info .price')?.textContent.trim() || "無資料";
        const ethanolFuel_price = document.querySelector('.today_price_ct li:nth-child(4) .today_price_info .price')?.textContent.trim() || "無資料";
        const superDiesel_price = document.querySelector('.today_price_ct li:nth-child(5) .today_price_info .price')?.textContent.trim() || "無資料";
        const LPG_price = document.querySelector('.today_price_ct li:nth-child(6) .today_price_info .price')?.textContent.trim() || "無資料";

        return {
            date,
            upsORdowns,
            rate,

            nine_two_price,
            nine_five_price,
            nine_eight_price,
            ethanolFuel_price,
            superDiesel_price,
            LPG_price,
        };
    });

    await browser.close();
    return OilData;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cpc_oil')
        .setNameLocalizations({
            "zh-TW" : "中油油價",
        })
        .setDescription("查詢 中油油價"),

    async execute (interaction) {
        const WaitMessage = await interaction.deferReply({
            fetchReply: true,
            ephemeral: true
        });

        const oil = await fetchCPCOilPrice();
        let oil_embed_color = Colors.Green;

        if(oil.upsORdowns === "調漲") oil_embed_color = Colors.Red;
        else if(oil.upsORdowns === "調降") oil_embed_color = Colors.Green;

        const oil_embed = new EmbedBuilder()
            .setAuthor({
                name: "台灣中油",
                iconURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/CPC_Corporation%2C_Taiwan_Seal.svg/800px-CPC_Corporation%2C_Taiwan_Seal.svg.png"
            })
            .setTitle(`本週汽油價格${oil.upsORdowns} ${oil.rate}`)
            .setDescription(`自 **${oil.date}** 零時起實施，單位：元/公升`)
            .setColor(oil_embed_color)
            .addFields([
                { name: "92無鉛", value: oil.nine_two_price ,inline: true },
                { name: "95無鉛", value: oil.nine_five_price ,inline: true },
                { name: "98無鉛", value: oil.nine_eight_price ,inline: true },
                { name: "酒精汽油", value: oil.ethanolFuel_price ,inline: true },
                { name: "超級柴油", value: oil.superDiesel_price ,inline: true },
                { name: "液化石油氣", value: oil.LPG_price ,inline: true },
            ])
            .setFooter({ text: "台灣中油股份有限公司 • CPC Corporation, Taiwan" })

        const url = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                    .setLabel("台灣中油官網")
                    .setStyle(ButtonStyle.Link)
                    .setURL("https://www.cpc.com.tw/"),
                new ButtonBuilder()
                    .setLabel("油價歷史資訊")
                    .setStyle(ButtonStyle.Link)
                    .setURL("https://www.cpc.com.tw/historyprice.aspx?n=2890"),
            ]);

        const SuccessMessage = await interaction.editReply({
            embeds : [ oil_embed ],
            components : [ url ]
        });
    }
}