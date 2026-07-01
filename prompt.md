Let's add a new news endpoint.

This one needs to save the news articles to the database also.
We'll skip the "Save to Database" button, and send the articles to the database automatically.

For the display of the articles, we'll pull from the database, and display 9 random articles.

```cURL
curl --request GET \
	--url 'https://google-news13.p.rapidapi.com/business?lr=en-US' \
	--header 'Content-Type: application/json' \
	--header 'x-rapidapi-host: google-news13.p.rapidapi.com' \
	--header 'x-rapidapi-key: 7c865acbb2mshcc50463954c34e0p1d8fbejsn2b284b78c83c'
```

```json
{
  "status": "success",
  "items": [
    {
      "newsUrl": "https://www.cnbc.com/2026/06/28/stock-futures-today-live-updates.html",
      "subnews": [
        {
          "newsUrl": "https://www.cnbc.com/2026/06/29/oil-prices-wti-brent-crude-us-iran-strikes-strait-hormuz-talks.html",
          "timestamp": "1782691200000",
          "snippet": "Oil edged higher on Monday after renewed military strikes between the U.S. and Iran reignited concerns over crude supplies from the Middle East.",
          "title": "Oil rises as renewed U.S.-Iran strikes reignite Middle East supply fears",
          "publisher": "CNBC",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNDVjbWhrUlc5TmVtcHNhVzUzVFJDZkF4ampCU2dLTWdhUmtvd1J0UVU=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNDVjbWhrUlc5TmVtcHNhVzUzVFJDZkF4ampCU2dLTWdhUmtvd1J0UVU"
          }
        },
        {
          "newsUrl": "https://www.nytimes.com/2026/06/28/business/oil-markets-edge-higher-after-days-of-attacks-in-persian-gulf.html",
          "timestamp": "1782686727000",
          "snippet": "Oil prices inched higher Sunday as trading resumed after a weekend of attacks and threats by Iran and the United States that threatened their cease-fire...",
          "title": "Oil Markets Edge Higher After Days of Attacks in Persian Gulf",
          "publisher": "The New York Times",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iI0NnNDROamRsU1hsdWJHMWxRMk5wVFJDcUJCaXFCQ2dLTWdB=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iI0NnNDROamRsU1hsdWJHMWxRMk5wVFJDcUJCaXFCQ2dLTWdB"
          }
        },
        {
          "newsUrl": "https://www.barrons.com/articles/futures-sunday-trading-prices-stock-d0ae1bb0",
          "timestamp": "1782684720000",
          "snippet": "Stock futures wobbled at the start of trading and then rose on Sunday, and oil rose, too, amid concerns that strikes between Iran and U.S. forces could...",
          "title": "Stock Futures, Oil Rising After Renewed Iran Tensions",
          "publisher": "Barron's",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNTJTRXRXTjFSUVpFVkhaMHhMVFJERUF4aW5CU2dLTWdZdFFvajBuQWc=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNTJTRXRXTjFSUVpFVkhaMHhMVFJERUF4aW5CU2dLTWdZdFFvajBuQWc"
          }
        },
        {
          "newsUrl": "https://www.wsj.com/finance/commodities-futures/oil-futures-fall-on-likely-technical-correction-93e57fe0",
          "timestamp": "1782511560000",
          "snippet": "1749 ET – U.S. oil futures climb back above $70 a barrel in late trading after the U.S. launched a fresh attack on Iran a day after Tehran struck a ship in...",
          "title": "Oil Prices Rise Above $70 on Iran Strike",
          "publisher": "WSJ",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNUNPVlptWjNCck4wdHZZbkUyVFJDcUJCaXFCQ2dLTWdZaDhvZ3V5UU0=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNUNPVlptWjNCck4wdHZZbkUyVFJDcUJCaXFCQ2dLTWdZaDhvZ3V5UU0"
          }
        },
        {
          "newsUrl": "https://www.reuters.com/business/energy/oil-climbs-following-renewed-us-iran-strikes-middle-east-2026-06-28/",
          "timestamp": "1782689672000",
          "snippet": "SINGAPORE, June 29 (Reuters) - Oil prices rose on Monday following days of tit-for-tat ‌strikes by the United States and Iran in the Middle East that...",
          "title": "Oil climbs following renewed US, Iran strikes in Middle East",
          "publisher": "Reuters",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iI0NnNTZNMVJ0TUhsMVpGTnlOVXBvVFJDOUF4aXhCU2dLTWdB=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iI0NnNTZNMVJ0TUhsMVpGTnlOVXBvVFJDOUF4aXhCU2dLTWdB"
          }
        },
        {
          "newsUrl": "https://www.bbc.com/news/articles/c0jy7d7wzv4o",
          "timestamp": "1782401524000",
          "snippet": "The price of oil has fallen to levels not seen since before the Iran war as traffic through the key Strait of Hormuz shipping route gradually resumes.",
          "title": "Oil price falls to levels not seen since before Iran war",
          "publisher": "BBC",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNTBPVTk0YWxZM1F6UXhZVFo1VFJDTkFoamdBeWdLTWdhMUFvcFJrUW8=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNTBPVTk0YWxZM1F6UXhZVFo1VFJDTkFoamdBeWdLTWdhMUFvcFJrUW8"
          }
        }
      ],
      "timestamp": "1782684900000",
      "hasSubnews": true,
      "snippet": "Stock futures were slightly higher on Sunday, as tensions between Iran and the U.S. escalated once again following renewed attacks in the Middle East...",
      "title": "Stock futures rise along with oil prices as traders weigh U.S. attacks on Iran over the weekend: Live updates",
      "publisher": "CNBC",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNTJNM2RRTkVKVFQwaFpVelJzVFJDZkF4ampCU2dLTWdZUkZwWm9FZ28=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNTJNM2RRTkVKVFQwaFpVelJzVFJDZkF4ampCU2dLTWdZUkZwWm9FZ28"
      }
    },
    {
      "newsUrl": "https://finance.yahoo.com/markets/stocks/articles/why-wall-street-thinks-us-150000483.html",
      "subnews": [
        {
          "newsUrl": "https://www.wsj.com/finance/the-long-term-threat-to-the-memory-chip-boom-is-innovation-bb289488",
          "timestamp": "1782466200000",
          "snippet": "Memory chip companies will have no problem selling everything they can make for a while. The biggest risk now is that their largest customers start getting...",
          "title": "The Long-Term Threat to the Memory Chip Boom Is Innovation",
          "publisher": "WSJ",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iJ0NnNW5kVU15UWxvME9GVjFSRFZQVFJERUF4aW5CU2dLTWdNQmtBQQ=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iJ0NnNW5kVU15UWxvME9GVjFSRFZQVFJERUF4aW5CU2dLTWdNQmtBQQ"
          }
        },
        {
          "newsUrl": "https://seekingalpha.com/article/4918306-markets-got-its-final-warnings",
          "timestamp": "1782631568000",
          "snippet": "Tech and semiconductor ETFs declined last week, reflecting concerns over inflationary supply chain costs impacting the AI economy. Read why the markets...",
          "title": "Markets Got Its Final Warnings (NASDAQ:SMH)",
          "publisher": "Seeking Alpha",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNTJTbGh5VDNwM2FYbHRSMmMzVFJERUF4aW1CU2dLTWdZbFpJNnRyUVk=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNTJTbGh5VDNwM2FYbHRSMmMzVFJERUF4aW1CU2dLTWdZbFpJNnRyUVk"
          }
        },
        {
          "newsUrl": "https://fortune.com/2026/06/26/micron-technology-346-percent-revenue-surge-ai-memory-chips-hbm-earnings-2026/",
          "timestamp": "1782457320000",
          "snippet": "Micron may not be a household name, but it may just be among the most important tech companies in the AI era, and definitely one with a surprising backstory...",
          "title": "Meet Micron, the under-the-radar chipmaker that just reported a 346% sales surge and helped stop a global AI selloff",
          "publisher": "Fortune",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNUlUVEpzTlRSd1oxWjJkR3R6VFJERUF4aW1CU2dLTWdhaE5aVE5HUW8=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNUlUVEpzTlRSd1oxWjJkR3R6VFJERUF4aW1CU2dLTWdhaE5aVE5HUW8"
          }
        },
        {
          "newsUrl": "https://www.marketwatch.com/story/micron-is-about-to-be-more-profitable-than-any-u-s-company-except-nvidia-and-google-3a83e343",
          "timestamp": "1782655200000",
          "snippet": "Big Tech companies are willing to pay astronomical prices for AI memory components, helping spark a dramatic turnaround in Micron's finances.",
          "title": "Micron is about to be more profitable than any U.S. company except Nvidia and Google",
          "publisher": "MarketWatch",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNVVkbnBDWkZjelZIVlVSbUZoVFJERUF4aW1CU2dLTWdZVlZKYlByUWc=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNVVkbnBDWkZjelZIVlVSbUZoVFJERUF4aW1CU2dLTWdZVlZKYlByUWc"
          }
        },
        {
          "newsUrl": "https://investorplace.com/smartmoney/2026/06/crowd-found-micron-how-to-find-next-one/",
          "timestamp": "1782626440000",
          "snippet": "Editor's Note: My friend and InvestorPlace colleague Louis Navellier believes Micron's blowout earnings report reveals something important about the next...",
          "title": "The Crowd Found Micron – This Is How to Find the Next One",
          "publisher": "InvestorPlace",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNWljVFpoZFZaQlREVmhaRUYxVFJDZkF4ampCU2dLTWdZeFk0QlNwUVE=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNWljVFpoZFZaQlREVmhaRUYxVFJDZkF4ampCU2dLTWdZeFk0QlNwUVE"
          }
        },
        {
          "newsUrl": "https://www.barrons.com/articles/micron-stock-price-still-cheap-12408e32",
          "timestamp": "1782450000000",
          "snippet": "Micron has never before had this kind of market power, and it hasn't taken long to throw around its newfound muscle.",
          "title": "Micron Is Breaking the Shackles of History. Why the Stock Could Still Double From Here.",
          "publisher": "Barron's",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNXVObWxEV1RJNFdUQXdZV2RzVFJERUF4aW5CU2dLTWdZbFFvN3RuUWs=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNXVObWxEV1RJNFdUQXdZV2RzVFJERUF4aW5CU2dLTWdZbFFvN3RuUWs"
          }
        }
      ],
      "timestamp": "1782658800000",
      "hasSubnews": true,
      "snippet": "Micron, the Boise, Idaho-based memory chip maker, has captured Wall Street's heart. Whether the love affair endures will heavily depend on how long the...",
      "title": "Why Wall Street thinks US memory maker Micron is the next Nvidia",
      "publisher": "Yahoo Finance",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNXhTVXRYZVhod1psRm1VbXMwVFJERUF4aW1CU2dLTWdZTmtKQm52Z1U=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNXhTVXRYZVhod1psRm1VbXMwVFJERUF4aW1CU2dLTWdZTmtKQm52Z1U"
      }
    },
    {
      "newsUrl": "https://thehill.com/policy/healthcare/5943361-activists-maha-supreme-court-monsanto/",
      "subnews": [
        {
          "newsUrl": "https://www.yahoo.com/news/politics/articles/marjorie-taylor-greene-says-awful-223104790.html",
          "timestamp": "1782599464000",
          "snippet": "Benzinga and Yahoo Finance LLC may earn commission or revenue on some items through the links below. Former Rep. Marjorie Taylor Greene criticized both the...",
          "title": "Marjorie Taylor Greene Says It Is 'Awful' That 'No One Is Standing Up For Cancer Patients' After Bayer Scores Roundup Victory In Supreme Court",
          "publisher": "Yahoo",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNVpkVXBpYjJkWlIwZGxNRzV4VFJERUF4aW1CU2dLTWdheE5JNlFtUWs=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNVpkVXBpYjJkWlIwZGxNRzV4VFJERUF4aW1CU2dLTWdheE5JNlFtUWs"
          }
        },
        {
          "newsUrl": "https://www.nytimes.com/2026/06/25/us/politics/supreme-court-weedkiller-roundup-bayer.html",
          "timestamp": "1782399057000",
          "snippet": "The Supreme Court on Thursday sided with the manufacturer of the weedkiller Roundup, overturning a jury award for a Missouri man who claimed the widely used...",
          "title": "Supreme Court Rejects Lawsuit Alleging Roundup Weedkiller Caused Cancer",
          "publisher": "The New York Times",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNXNPRXBQYWpsR2FWVnJaR0poVFJDUUF4allCQ2dLTWdZQkVJTElzQU0=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNXNPRXBQYWpsR2FWVnJaR0poVFJDUUF4allCQ2dLTWdZQkVJTElzQU0"
          }
        },
        {
          "newsUrl": "https://www.scotusblog.com/2026/06/court-rules-for-roundup-maker-in-dispute-over-cancer-warnings-on-pesticide-labels/",
          "timestamp": "1782424740000",
          "snippet": "Updated on June 25 at 5:59 p.m.. The Supreme Court on Thursday sided with Monsanto in a high-stakes dispute over cancer warnings on pesticide labels.",
          "title": "Court rules for Roundup maker in dispute over cancer warnings on pesticide labels",
          "publisher": "SCOTUSblog",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNU9kR2cyYlVaMmVqRnRia0V5VFJDUUF4ai1CU2dLTWdZQlVKSkRMUWc=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNU9kR2cyYlVaMmVqRnRia0V5VFJDUUF4ai1CU2dLTWdZQlVKSkRMUWc"
          }
        },
        {
          "newsUrl": "https://www.statnews.com/2026/06/27/roundup-glyphosate-cancer-monsanto-v-durnell-supreme-court/",
          "timestamp": "1782558198000",
          "snippet": "A Supreme Court case on Monsanto's Roundup is an important legal ruling, but it doesn't answer the scientific question of causation.",
          "title": "Supreme Court ruling on Roundup points to a confusing difference between the law and science",
          "publisher": "statnews.com",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iL0NnNVlUM1EwUWt4UFRIUlZXV3BKVFJDcUJCaXFCQ2dLTWdrQmtJNGl2MlZjcmdF=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iL0NnNVlUM1EwUWt4UFRIUlZXV3BKVFJDcUJCaXFCQ2dLTWdrQmtJNGl2MlZjcmdF"
          }
        },
        {
          "newsUrl": "https://www.pbs.org/newshour/show/what-science-tells-us-about-the-health-risks-of-roundup",
          "timestamp": "1782426958000",
          "snippet": "In a 7-2 ruling, the Supreme Court sided with the manufacturer of Roundup, overturning a Missouri jury award for a man who claimed the herbicide caused...",
          "title": "What science tells us about the health risks of Roundup",
          "publisher": "PBS",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iL0NnNDVXRFIxTWkxeVFVaFNkM1JsVFJERUF4aW1CU2dLTWdtSm9ZelV1Q1c1Y0FF=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iL0NnNDVXRFIxTWkxeVFVaFNkM1JsVFJERUF4aW1CU2dLTWdtSm9ZelV1Q1c1Y0FF"
          }
        },
        {
          "newsUrl": "https://www.bayer.com/media/en-us/monsanto-wins-landmark-roundup-case-at-us-supreme-court/",
          "timestamp": "1782402060000",
          "snippet": "Leverkusen, June 25, 2026 – The U.S. Supreme Court issued a 7:2 landmark ruling in the Durnell Roundup™ case on Thursday, affirming that the Federal...",
          "title": "Monsanto wins landmark Roundup™ case at U.S. Supreme Court",
          "publisher": "Bayer",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNXlUSFZhTVhwV2JVdHphM0ozVFJDUkF4ajhCU2dLTWdZZEFKSnJKUWM=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNXlUSFZhTVhwV2JVdHphM0ozVFJDUkF4ajhCU2dLTWdZZEFKSnJKUWM"
          }
        }
      ],
      "timestamp": "1782680400000",
      "hasSubnews": true,
      "snippet": "Prominent activists with the “Make America Healthy Again” (MAHA) movement are raging and saying they feel betrayed after the Supreme Court sided with...",
      "title": "MAHA feels betrayed after Supreme Court ruling on Monsanto, glyphosate",
      "publisher": "The Hill",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNTNlVkZPT0hkWE16UXRaM0JwVFJDZkF4ampCU2dLTWdZQllJcmtyZ1k=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNTNlVkZPT0hkWE16UXRaM0JwVFJDZkF4ampCU2dLTWdZQllJcmtyZ1k"
      }
    },
    {
      "newsUrl": "https://www.foxbusiness.com/personal-finance/rachel-cruze-warns-young-men-throwing-money-away-habit-taking-down-generation",
      "timestamp": "1782675925000",
      "hasSubnews": false,
      "snippet": "Rachel Cruze is warning young adults — especially young men — that chasing \"quick\" money through sports betting, cryptocurrency and risky real estate moves...",
      "title": "Rachel Cruze warns young men are ‘throwing’ money away on habit ‘taking down a generation’",
      "publisher": "Fox Business",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNTRTRzlhY1VSRk9EUlhSVTFxVFJDZkF4ampCU2dLTWdZTllKaW1wZ2c=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNTRTRzlhY1VSRk9EUlhSVTFxVFJDZkF4ampCU2dLTWdZTllKaW1wZ2c"
      }
    },
    {
      "newsUrl": "https://www.reuters.com/business/finance/global-markets-bis-pix-2026-06-28/",
      "subnews": [
        {
          "newsUrl": "https://www.ft.com/content/e81ce414-e4bd-4e8c-bac7-94f7bf17def4?syn-25a6b1a6=1",
          "timestamp": "1782637207000",
          "snippet": "Weak returns could trigger a sharp pullback in funding for tech companies that threatens the global economy.",
          "title": "AI ‘exuberance’ risks ending in lengthy investment bust, BIS warns",
          "publisher": "Financial Times",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNU5SbEJoYkdSNWRUUmZXRlZ1VFJDZkF4ampCU2dLTWdZbEVJSVNvUU0=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNU5SbEJoYkdSNWRUUmZXRlZ1VFJDZkF4ampCU2dLTWdZbEVJSVNvUU0"
          }
        },
        {
          "newsUrl": "https://www.wsj.com/economy/bis-sees-peril-for-economy-financial-system-in-ai-investment-boom-326960fb",
          "timestamp": "1782690360000",
          "snippet": "FILE PHOTO: The tower of the headquarters of the Bank for International Settlements (BIS) is seen in Basel, Switzerland March 18, 2021.",
          "title": "BIS Sees Peril for Economy, Financial System in AI Investment Boom",
          "publisher": "WSJ",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNWhXVkZ3Wnkxc2JXeHRZeTFDVFJDLUFSaUpBaWdCTWdZRllJTE9xUVU=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNWhXVkZ3Wnkxc2JXeHRZeTFDVFJDLUFSaUpBaWdCTWdZRllJTE9xUVU"
          }
        },
        {
          "newsUrl": "https://www.telegraph.co.uk/business/2026/06/28/ai-boom-risks-global-financial-crash-central-bankers-warn/",
          "timestamp": "1782653340000",
          "snippet": "Reversal of 'excessive' tech investments could have serious economic consequences, report finds.",
          "title": "AI boom risks global financial crash, warn central bankers",
          "publisher": "The Telegraph",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNVNhMTg0TTBOSlRucDBkRmhTVFJDZkF4ampCU2dLTWdhVllZcjBzQVk=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNVNhMTg0TTBOSlRucDBkRmhTVFJDZkF4ampCU2dLTWdhVllZcjBzQVk"
          }
        },
        {
          "newsUrl": "https://www.bloomberg.com/news/articles/2026-06-28/ai-bust-risks-ripple-effects-from-growth-to-credit-bis-says",
          "timestamp": "1782637200000",
          "snippet": "An artificial-intelligence bust, inflation and fiscal stress are among the most alarming threats to global prosperity at present, the Bank for International...",
          "title": "AI Bust Risks Ripple Effects From Growth to Credit, BIS Says",
          "publisher": "Bloomberg.com",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNUNXbmRYUTA4MlJYWnhNVU4yVFJERUF4aW1CU2dLTWdZQlVJekVvZ2c=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNUNXbmRYUTA4MlJYWnhNVU4yVFJERUF4aW1CU2dLTWdZQlVJekVvZ2c"
          }
        },
        {
          "newsUrl": "https://www.smh.com.au/politics/federal/global-recession-and-the-end-of-the-middle-class-what-ai-exuberance-could-do-to-the-world-20260626-p60ag6.html",
          "timestamp": "1782637200000",
          "snippet": "One of the world's most respected economic institutions has warned that the AI boom powering the Australian and global economies could create an...",
          "title": "Global recession and the end of the middle class: What ‘AI exuberance’ could do to the world",
          "publisher": "SMH.com.au",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iJ0NnNU5kMnhEYTBVeVJWZE5WbXd5VFJESkFoaklCQ2dLTWdNQkFBSQ=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iJ0NnNU5kMnhEYTBVeVJWZE5WbXd5VFJESkFoaklCQ2dLTWdNQkFBSQ"
          }
        },
        {
          "newsUrl": "https://www.pymnts.com/news/artificial-intelligence/2026/bis-warns-that-ai-spending-may-not-be-sustainable/",
          "timestamp": "1782692038000",
          "snippet": "The Bank for International Settlements (BIS) is warning in its annual report that AI optimism could be a short-lived phenomenon.",
          "title": "BIS Warns That AI Spending May Not Be Sustainable",
          "publisher": "PYMNTS.com",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNHdSMmd0WDJJMFJsaG1RazFaVFJDU0FoakpBeWdLTWdhWlVwSUtxZ2M=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNHdSMmd0WDJJMFJsaG1RazFaVFJDU0FoakpBeWdLTWdhWlVwSUtxZ2M"
          }
        }
      ],
      "timestamp": "1782637426000",
      "hasSubnews": true,
      "snippet": "LONDON, June 28 (Reuters) - Global pressures from rising public debt to financial fragilities and the sustainability of ​the AI boom are increasing risks,...",
      "title": "BIS says debt, AI boom and fragilities raise global risks",
      "publisher": "Reuters",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iL0NnNXlkbE5VVTJSRmFHNVlVbmMyVFJERUF4aW1CU2dLTWdtUklwWVVFU3VhS1FJ=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iL0NnNXlkbE5VVTJSRmFHNVlVbmMyVFJERUF4aW1CU2dLTWdtUklwWVVFU3VhS1FJ"
      }
    },
    {
      "newsUrl": "https://shopping.yahoo.com/deals/breaking-news/live/the-best-prime-day-deals-you-can-still-get-last-chance-sales-from-apple-adidas-hanes-shark-and-more-134159136.html",
      "subnews": [
        {
          "newsUrl": "https://www.cnn.com/cnn-underscored/deals/best-amazon-prime-day-deals-2026-06-27",
          "timestamp": "1782669480000",
          "snippet": "Want more deals? Visit CNN Underscored's Guide to Prime Day for wall-to-wall coverage of the best discounts to be found during Amazon's massive sale.",
          "title": "Amazon Prime Day may be over, but 64 of the best deals are still up for grabs",
          "publisher": "CNN",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNTBVRmRUVEdneWFXZEVVelpVVFJDZkF4amlCU2dLTWdZTllvZ3dMUVU=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNTBVRmRUVEdneWFXZEVVelpVVFJDZkF4amlCU2dLTWdZTllvZ3dMUVU"
          }
        },
        {
          "newsUrl": "https://nymag.com/strategist/article/best-last-minute-prime-day-deals-2026.html",
          "timestamp": "1782523200000",
          "snippet": "After four days of Amazon Prime Day, the deals team found the best last-minute deals that you should shop before the sale ends tonight.",
          "title": "All the Rare, Cheapest-Ever, Best-Selling Prime Day Deals to Buy Before Tonight",
          "publisher": "New York Magazine",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNW9WM1p6T0VWWVN6WkJURVpWVFJDUUF4aVFBeWdLTWdZUkVvQ3V0UVU=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNW9WM1p6T0VWWVN6WkJURVpWVFJDUUF4aVFBeWdLTWdZUkVvQ3V0UVU"
          }
        },
        {
          "newsUrl": "https://www.vogue.com/article/editor-picks-prime-day-06-26-2026",
          "timestamp": "1782509100000",
          "snippet": "Last call! Here's what Vogue editors are actually shopping on Prime Day 2026—from beauty deals to fashion discounts and everything in between.",
          "title": "Everything Vogue Editors Are Buying on Prime Day",
          "publisher": "Vogue",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iL0NnNWFlV0p6TUc5UFNrWlpPR000VFJEZ0F4aUFCU2dLTWdrTkVwTEdFbW85eEFJ=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iL0NnNWFlV0p6TUc5UFNrWlpPR000VFJEZ0F4aUFCU2dLTWdrTkVwTEdFbW85eEFJ"
          }
        },
        {
          "newsUrl": "https://www.today.com/shop/best-amazon-prime-day-deals-live-2026-rcna351854",
          "timestamp": "1782574206000",
          "snippet": "We tracked post-Amazon Prime Day 2026 deals that are still live and updated this list with the best deals worth shopping across beauty, home, tech and more.",
          "title": "We’re Still Deal Hunting Even Though Prime Day Is Over — 60+ Deals to Shop ASAP",
          "publisher": "TODAY.com",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNU1kWHAzVERoS1VXdHNUMUIzVFJDWUFoaXdCQ2dLTWdZSkFJb0hGZ2s=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNU1kWHAzVERoS1VXdHNUMUIzVFJDWUFoaXdCQ2dLTWdZSkFJb0hGZ2s"
          }
        },
        {
          "newsUrl": "https://www.nytimes.com/wirecutter/money/best-prime-day-deals-2026-0626/",
          "timestamp": "1782534002000",
          "snippet": "Amazon Prime Day began in 2015 as a one-day sale. The mega-sale now extends for four days, and we've arrived at the final day of Prime Day 2026.",
          "title": "The Very Best Prime Day Deals We’ve Found (And Counting)",
          "publisher": "The New York Times",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNDVOMk13WVdsSGNHRXhUMGxLVFJDSEF4aVBCaWdLTWdZSlFvb1RIUVk=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNDVOMk13WVdsSGNHRXhUMGxLVFJDSEF4aVBCaWdLTWdZSlFvb1RIUVk"
          }
        },
        {
          "newsUrl": "https://komonews.com/shopping/hottest-deals-you-dont-want-to-miss-before-amazon-prime-day-ends-june-2026-add-to-cart-online-shopping-discounts-tech-fashion-fitness-wellness-skincare-kids-home",
          "timestamp": "1782524987000",
          "snippet": "These are your final hours to clear your online cart and save some money at checkout.",
          "title": "8 deals you don't want to miss before Amazon Prime Day ends",
          "publisher": "KOMO",
          "images": {
            "thumbnail": "https://news.google.com/api/attachments/CC8iL0NnNVJTbnBuWnkxbFFVSjVRa0oyVFJDZkF4amlCU2dLTWdrUklKVElwU2N1cHdJ=-w280-h168-p-df-rw",
            "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iL0NnNVJTbnBuWnkxbFFVSjVRa0oyVFJDZkF4amlCU2dLTWdrUklKVElwU2N1cHdJ"
          }
        }
      ],
      "timestamp": "1782647551000",
      "hasSubnews": true,
      "snippet": "Hurry! The epic savings event might officially be over, but we're still seeing deep discounts on major brands.",
      "title": "The best Prime Day deals you can still get: Last-chance sales from Apple, Adidas, Hanes, Shark and more",
      "publisher": "Yahoo",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNHliVE41UTNRd1pVRXpNek5DVFJDZkF4ampCU2dLTWdZTkFvNnRxUVk=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNHliVE41UTNRd1pVRXpNek5DVFJDZkF4ampCU2dLTWdZTkFvNnRxUVk"
      }
    },
    {
      "newsUrl": "https://www.bloomberg.com/news/newsletters/2026-06-28/apple-s-sweeping-price-hikes-bring-the-ai-era-home-m6-m7-touch-macbook-pro",
      "timestamp": "1782655201000",
      "hasSubnews": false,
      "snippet": "Apple's extensive price hikes are a blow to many customers and an implicit indictment of the AI era's soaring costs. Also: The latest on the touch-screen...",
      "title": "Apple’s Sweeping Price Increases Bring Home the Costs of the AI Era",
      "publisher": "Bloomberg.com",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNXdhMGgyTFRSTlJDMU5jM3BqVFJERUF4aW1CU2dLTWdhQndJeTFRQVU=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNXdhMGgyTFRSTlJDMU5jM3BqVFJERUF4aW1CU2dLTWdhQndJeTFRQVU"
      }
    },
    {
      "newsUrl": "https://www.investors.com/news/spacex-stock-will-join-nasdaq-100-index-july-7/",
      "timestamp": "1782583500000",
      "hasSubnews": false,
      "snippet": "SpaceX stock will be added to the Nasdaq-100 index before the open on Tuesday, July 7, Nasdaq confirmed late Friday. That will pave the way for passive...",
      "title": "It's Official: SpaceX To Join Nasdaq 100. Here's When It'll Join.",
      "publisher": "Investor's Business Daily",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iL0NnNWZkWGRhZVRFd2FGRXdhalJVVFJDZkF4amlCU2dLTWdtZE1vNVBKV2g3c1FF=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iL0NnNWZkWGRhZVRFd2FGRXdhalJVVFJDZkF4amlCU2dLTWdtZE1vNVBKV2g3c1FF"
      }
    },
    {
      "newsUrl": "https://apnews.com/article/economy-inflation-iran-trump-unemployment-935feff61ebcb6a7dfbb604b7a49fcff",
      "timestamp": "1782585540000",
      "hasSubnews": false,
      "snippet": "The Federal Reserve's preferred inflation gauge rose to a new three-year high in May as gas prices peaked, a sign rising costs could pose political problems...",
      "title": "America In Focus: Key inflation gauge surges to 3-year high, mortgage rate climbs",
      "publisher": "AP News",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iL0NnNUNUekozVVRoMlgwRmxRbDl6VFJERUF4aW1CU2dLTWdtQkFKSUNqNmw3YVFJ=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iL0NnNUNUekozVVRoMlgwRmxRbDl6VFJERUF4aW1CU2dLTWdtQkFKSUNqNmw3YVFJ"
      }
    },
    {
      "newsUrl": "https://www.euronews.com/2026/06/27/anthropic-cleared-to-restore-mythos-5-access-to-certain-us-organisations",
      "timestamp": "1782566174000",
      "hasSubnews": false,
      "snippet": "\"We're restoring access for these organizations quickly, and we're continuing to work with the government to expand access to Mythos 5 and make Fable 5...",
      "title": "Anthropic cleared to restore Mythos 5 access to certain US organisations",
      "publisher": "Euronews",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNURORWt3Y2xvMVUzZFVNV2hSVFJDZkF4ampCU2dLTWdhbFJKS3VwUWM=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNURORWt3Y2xvMVUzZFVNV2hSVFJDZkF4ampCU2dLTWdhbFJKS3VwUWM"
      }
    },
    {
      "newsUrl": "https://www.geeky-gadgets.com/gpt-5-6-cybersecurity-risks/",
      "timestamp": "1782633698000",
      "hasSubnews": false,
      "snippet": "OpenAI has introduced GPT 5.6, a release featuring three specialized models, Soul, Terra and Luna, tailored for different use cases. Soul uses its “Soul...",
      "title": "OpenAI Introduces ChatGPT 5.6 Soul, Terra and Luna Models",
      "publisher": "Geeky Gadgets",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iMkNnNXBkRmxDY1RSM2EyWndRalI1VFJDZkF4ampCU2dLTWd1Qk1KU3dtQ2JnS09vZ2N3=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iMkNnNXBkRmxDY1RSM2EyWndRalI1VFJDZkF4ampCU2dLTWd1Qk1KU3dtQ2JnS09vZ2N3"
      }
    },
    {
      "newsUrl": "https://www.local10.com/news/local/2026/06/27/bso-11-year-old-girl-man-shot-outside-hallandale-beach-mcdonalds-suspect-at-large/",
      "timestamp": "1782585411000",
      "hasSubnews": false,
      "snippet": "An 11-year-old girl and a man were shot outside a McDonald's in Hallandale Beach on Saturday afternoon, deputies with the Broward Sheriff's Office confirmed...",
      "title": "Police: Father and daughter, 11, shot outside Hallandale Beach McDonald’s; suspect at large",
      "publisher": "WPLG Local 10",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNTVXRFpyWmsxaVRXdzJkemxaVFJDZkF4ampCU2dLTWdZQlFKSWlwUWM=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNTVXRFpyWmsxaVRXdzJkemxaVFJDZkF4ampCU2dLTWdZQlFKSWlwUWM"
      }
    },
    {
      "newsUrl": "https://www.npr.org/2026/06/28/nx-s1-5872458/brazil-trade-us-tariffs-europe",
      "timestamp": "1782661542000",
      "hasSubnews": false,
      "snippet": "U.S. tariff pressure is pushing Europe and Brazil closer—opening new global doors for everything from aircraft parts to Brazil's cachaça, the base of the...",
      "title": "Trade tensions shake up Brazil’s caipirinha spirit",
      "publisher": "NPR",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iL0NnNWlNVXRKVnpSUVgxTXRNSFZIVFJDeEF4akVCU2dLTWdrVkFveHNIU2lpY0FF=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iL0NnNWlNVXRKVnpSUVgxTXRNSFZIVFJDeEF4akVCU2dLTWdrVkFveHNIU2lpY0FF"
      }
    },
    {
      "newsUrl": "https://www.reuters.com/business/austria-lobbies-eu-host-anthropic-ai-after-us-curbs-bloomberg-news-reports-2026-06-28/",
      "timestamp": "1782654578000",
      "hasSubnews": false,
      "snippet": "VIENNA, June 28 (Reuters) - Austria has proposed that the European Union should consider hosting Anthropic within ​the bloc's borders in order to counter...",
      "title": "Austria urges Europe to host Anthropic following US curbs on AI access",
      "publisher": "Reuters",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNVZkWHBMTFU5QllWWjZUWFZRVFJERUF4aW1CU2dLTWdZdGdZYlF2QU0=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNVZkWHBMTFU5QllWWjZUWFZRVFJERUF4aW1CU2dLTWdZdGdZYlF2QU0"
      }
    },
    {
      "newsUrl": "https://techcrunch.com/2026/06/28/techcrunch-mobility-all-eyes-on-tesla-fsd/",
      "timestamp": "1782662700000",
      "hasSubnews": false,
      "snippet": "Welcome back to TechCrunch Mobility, your hub for the future of transportation and now, more than ever, how AI is playing a part.",
      "title": "TechCrunch Mobility: All eyes on Tesla FSD",
      "publisher": "TechCrunch",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNHRkbEJ0T1RaWFZUUlZWbG94VFJERUF4aW5CU2dLTWdZQk1vcElOUWM=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNHRkbEJ0T1RaWFZUUlZWbG94VFJERUF4aW5CU2dLTWdZQk1vcElOUWM"
      }
    },
    {
      "newsUrl": "https://www.investopedia.com/what-to-expect-in-markets-this-week-june-jobs-numbers-and-an-update-on-american-consumers-mood-12006437",
      "timestamp": "1782640800000",
      "hasSubnews": false,
      "snippet": "June jobs numbers are coming, and investors are likely to study them even more carefully now that the Fed is eyeing higher interest rates.",
      "title": "What To Expect in Markets This Week: June Jobs Numbers and an Update on American Consumers’ Mood",
      "publisher": "Investopedia",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNWxVamRqTVVWcFJUQTFXVjh5VFJEREF4aW9CU2dLTWdhRmNKSmxzZ1k=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNWxVamRqTVVWcFJUQTFXVjh5VFJEREF4aW9CU2dLTWdhRmNKSmxzZ1k"
      }
    },
    {
      "newsUrl": "https://nypost.com/2026/06/27/business/expect-dei-to-be-a-non-factor-in-the-horse-race-for-jamie-dimons-jpmorgan-successor/",
      "timestamp": "1782604860000",
      "hasSubnews": false,
      "snippet": "Last week, JPMorgan Chase startled Wall Street with an abrupt disclosure that two of its senior bankers — Troy Rohrbaugh and Doug Petno — had been named...",
      "title": "Expect DEI to be a non-factor in the horse race for Jamie Dimon’s JPMorgan successor",
      "publisher": "New York Post",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNTZOMEpYVDJoSk9WWkNUR1Z3VFJEVEF4aVJCU2dLTWdhcFJZYk5vUWc=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNTZOMEpYVDJoSk9WWkNUR1Z3VFJEVEF4aVJCU2dLTWdhcFJZYk5vUWc"
      }
    },
    {
      "newsUrl": "https://www.wdsu.com/article/american-airlines-miami-flight-aborts/71758793",
      "timestamp": "1782616800000",
      "hasSubnews": false,
      "snippet": "An American Airlines flight headed to Bermuda aborted its takeoff in Miami Saturday evening after a business jet entered the same runway, getting as close...",
      "title": "American Airlines flight aborts takeoff in Miami after business jet enters the same runway",
      "publisher": "WDSU",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNHdhVVppWDJoRlVuWlZZMnRwVFJDZkF4amlCU2dLTWdhSk1KemtwZ2c=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNHdhVVppWDJoRlVuWlZZMnRwVFJDZkF4amlCU2dLTWdhSk1KemtwZ2c"
      }
    },
    {
      "newsUrl": "https://www.cnbc.com/2026/06/28/us-auto-market.html",
      "timestamp": "1782644401000",
      "hasSubnews": false,
      "snippet": "The auto industry is selling fewer cars--one forecaster says this is a fundamental change, and it is going to get worse.",
      "title": "A 'perfect storm' points to a much smaller U.S. auto market by 2040",
      "publisher": "CNBC",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iMkNnNVdNemQ0V0hCNVJHRjRSbEZ6VFJDZkF4ampCU2dLTWdzQkVJaW5GT1p5TlFueXFR=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iMkNnNVdNemQ0V0hCNVJHRjRSbEZ6VFJDZkF4ampCU2dLTWdzQkVJaW5GT1p5TlFueXFR"
      }
    },
    {
      "newsUrl": "https://finance.yahoo.com/energy/articles/2-25-pump-trump-says-131500941.html",
      "timestamp": "1782652500000",
      "hasSubnews": false,
      "snippet": "Moneywise and Yahoo Finance LLC may earn commission or revenue through links in the content below. President Donald Trump is accusing major oil companies of...",
      "title": "‘We should be at $2.25 at the pump’: Trump says Exxon, Chevron, Shell and BP are price gouging drivers. Do you agree?",
      "publisher": "Yahoo Finance",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNUtTa1ZEWldaNldrOVhZbWxXVFJDZkF4ampCU2dLTWdhcEZaN3RsUW8=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNUtTa1ZEWldaNldrOVhZbWxXVFJDZkF4ampCU2dLTWdhcEZaN3RsUW8"
      }
    },
    {
      "newsUrl": "https://www.fool.com/investing/2026/06/28/fed-chair-kevin-warsh-problem-markets-bad-stocks/",
      "timestamp": "1782646980000",
      "hasSubnews": false,
      "snippet": "Kevin Warsh is already having a noticeable impact on the Federal Reserve. The FOMC held its first meeting since Warsh took the position of chairman earlier...",
      "title": "New Fed Chair Kevin Warsh Says There's a Huge Problem With Financial Markets Right Now. His Solution Could Be Bad News For Stock Investors",
      "publisher": "The Motley Fool",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNU9iamMxYzBobFJtVnZZa1I2VFJERUF4aW1CU2dLTWdZWk9KeEpHZ28=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNU9iamMxYzBobFJtVnZZa1I2VFJERUF4aW1CU2dLTWdZWk9KeEpHZ28"
      }
    },
    {
      "newsUrl": "https://www.thestreet.com/retail/saks-global-iconic-luxury-retailer-exits-bankruptcy-after-cuts",
      "timestamp": "1782654420000",
      "hasSubnews": false,
      "snippet": "The luxury retailer says it has cut debt by nearly 75%, but its reset follows store closures and more than 1800 job cuts.",
      "title": "Iconic luxury retailer exits bankruptcy after deep cuts",
      "publisher": "thestreet.com",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iL0NnNDRiVFYxVFRWYU16VmlTSFZ0VFJDZkF4ampCU2dLTWdrQlVJRHF5R0Z6endF=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iL0NnNDRiVFYxVFRWYU16VmlTSFZ0VFJDZkF4ampCU2dLTWdrQlVJRHF5R0Z6endF"
      }
    },
    {
      "newsUrl": "https://www.bloomberg.com/news/articles/2026-06-28/leverage-that-fueled-us-stock-rally-becomes-a-growing-concern",
      "timestamp": "1782655200000",
      "hasSubnews": false,
      "snippet": "The leverage that helped fuel the US stock rally is now becoming an increasing source of unease.",
      "title": "Leverage That Fueled US Stock Rally Becomes a Growing Concern",
      "publisher": "Bloomberg.com",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNWZhMDlOTW5kcVdFOUVPVVJqVFJERUF4aW1CU2dLTWdZRlVJeXVMQVk=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNWZhMDlOTW5kcVdFOUVPVVJqVFJERUF4aW1CU2dLTWdZRlVJeXVMQVk"
      }
    },
    {
      "newsUrl": "https://www.theblock.co/post/406460/michael-saylor-signals-another-bitcoin-buy-as-strategy-sits-about-13-billion-underwater",
      "timestamp": "1782663193000",
      "hasSubnews": false,
      "snippet": "A Monday filing would mark Strategy's fourth straight week of buying, after a 520 BTC purchase on June 22 that was its smallest recent tranche.",
      "title": "Michael Saylor signals another bitcoin buy as Strategy sits about $13 billion underwater",
      "publisher": "The Block",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNUhkbmh3V2tNNVEzbDRNbGQ0VFJDZkF4ampCU2dLTWdhWmNwSnBxZ2M=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNUhkbmh3V2tNNVEzbDRNbGQ0VFJDZkF4ampCU2dLTWdhWmNwSnBxZ2M"
      }
    },
    {
      "newsUrl": "https://www.politico.com/news/2026/06/28/health-insurers-maha-rfk-doctors-00977386",
      "timestamp": "1782676800000",
      "hasSubnews": false,
      "snippet": "The companies are offering benefits aimed at appealing to Robert F. Kennedy Jr. and his Make America Healthy Again movement.",
      "title": "Here’s why your health insurer is sounding more like RFK Jr.",
      "publisher": "Politico",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNTNMVTVPTkVZMldHZ3lVbGM0VFJDa0F4ajJCQ2dLTWdhdEpKeXVHUW8=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNTNMVTVPTkVZMldHZ3lVbGM0VFJDa0F4ajJCQ2dLTWdhdEpKeXVHUW8"
      }
    },
    {
      "newsUrl": "https://www.espn.com/soccer/story/_/id/49190854/world-cup-fans-vindicate-usmnt-weston-mckennie-love-ranch-american-dressing",
      "timestamp": "1782560820000",
      "hasSubnews": false,
      "snippet": "IRVINE, Calif. -- France and Argentina have certainly been impressive, but the team making the biggest impact during this World Cup group stage -- the team...",
      "title": "Not laughing now: How World Cup fans vindicated McKennie's love of ranch",
      "publisher": "ESPN",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNUZlalJ5YTBrM1MzZFdWakpOVFJDZkF4ampCU2dLTWdhMVZJNXdvUWc=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNUZlalJ5YTBrM1MzZFdWakpOVFJDZkF4ampCU2dLTWdhMVZJNXdvUWc"
      }
    },
    {
      "newsUrl": "https://9to5google.com/2026/06/28/tech-price-hikes/",
      "timestamp": "1782651600000",
      "hasSubnews": false,
      "snippet": "Perhaps the most visible impact of the AI industry right now is that consumer electronics are getting more expensive. Price hikes are happening left and...",
      "title": "Your favorite tech will keep getting more expensive, and you can blame AI",
      "publisher": "9to5Google",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNHlXakZ1TVd4bFQzRktPVUZYVFJDSEF4aVBCaWdLTWdZMVFvb1RuUWM=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNHlXakZ1TVd4bFQzRktPVUZYVFJDSEF4aVBCaWdLTWdZMVFvb1RuUWM"
      }
    },
    {
      "newsUrl": "https://www.ft.com/content/14d2e591-7cd5-4456-904f-1b7fdc5cbc1a?syn-25a6b1a6=1",
      "timestamp": "1782532834000",
      "hasSubnews": false,
      "snippet": "The head of the US's largest utility has warned that the nation could face blackouts as soon as 2027 due to the strain AI has put on the grid,...",
      "title": "Utility boss warns US faces blackouts due to power supply shortfall",
      "publisher": "Financial Times",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNW9ibFJzVjNFd1VWUkhhVVJXVFJDZkF4ampCU2dLTWdhVlVvYUhIZ2s=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNW9ibFJzVjNFd1VWUkhhVVJXVFJDZkF4ampCU2dLTWdhVlVvYUhIZ2s"
      }
    },
    {
      "newsUrl": "https://www.nytimes.com/2026/06/28/us/politics/federal-buildings-repair-backlog.html",
      "timestamp": "1782648059000",
      "hasSubnews": false,
      "snippet": "After decades, deferred maintenance totals an estimated $50 billion. But getting repair funds from Congress is a laborious process.",
      "title": "Rats, Leaks and Broken Elevators: Repair Backlog Plagues Federal Buildings",
      "publisher": "The New York Times",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNVFOV2xXVVU1WFptSjJORkYxVFJDQUJSamdBeWdLTWdZQmdJVE9TUVE=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNVFOV2xXVVU1WFptSjJORkYxVFJDQUJSamdBeWdLTWdZQmdJVE9TUVE"
      }
    },
    {
      "newsUrl": "https://www.cnbc.com/2026/06/28/medicare-will-soon-cover-obesity-drugs-but-many-seniors-may-not-know.html",
      "timestamp": "1782648001000",
      "hasSubnews": false,
      "snippet": "Millions of older Americans in Medicare are about to gain access to obesity drugs through Medicare's new Bridge demonstration program for a monthly copay of...",
      "title": "Seniors in Medicare are about to get landmark obesity drug coverage — but many may not know it yet",
      "publisher": "CNBC",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iL0NnNU1abGRyWTE5dE5rdFRkRmxHVFJDZkF4ampCU2dLTWdrWkZKWlJKU2lpNUFJ=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iL0NnNU1abGRyWTE5dE5rdFRkRmxHVFJDZkF4ampCU2dLTWdrWkZKWlJKU2lpNUFJ"
      }
    },
    {
      "newsUrl": "https://wccftech.com/jefferies-warns-memory-prices-surge-50-percent-q3-40-in-q4-2026-no-relief-until-2028/",
      "timestamp": "1782590400000",
      "hasSubnews": false,
      "snippet": "Memory prices are all set to rise further in the coming quarters of 2026 as persistent shortages continue to grip the market.",
      "title": "Jefferies Warns Memory Prices Will Surge 50% in Q3 2026 and Another 40% in Q4, With No Relief Until 2028",
      "publisher": "Wccftech",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iL0NnNWpRbFpsYm04MlZtUTVVRmQ2VFJDVEF4ajVCU2dLTWdrUmtJaUtNR1FsaWdJ=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iL0NnNWpRbFpsYm04MlZtUTVVRmQ2VFJDVEF4ajVCU2dLTWdrUmtJaUtNR1FsaWdJ"
      }
    },
    {
      "newsUrl": "https://www.wbrz.com/news/1-injured-in-saturday-night-shooting-at-mcdonald-s-on-perkins-road/",
      "timestamp": "1782654929000",
      "hasSubnews": false,
      "snippet": "BATON ROUGE — A Saturday night shooting at a McDonald's on Perkins Road left one man injured, according to the East Baton Rouge Sheriff's Office.",
      "title": "1 injured in Saturday night shooting at McDonald's on Perkins Road",
      "publisher": "WBRZ",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNVhaVTlpYjFOR05YRlZaRXhtVFJDZkF4ampCU2dLTWdZQk1Jd2hvd2s=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNVhaVTlpYjFOR05YRlZaRXhtVFJDZkF4ampCU2dLTWdZQk1Jd2hvd2s"
      }
    },
    {
      "newsUrl": "https://www.cnbc.com/2026/06/27/china-industrial-profits-stay-resilient-as-economy-leans-on-factories.html",
      "timestamp": "1782558781000",
      "hasSubnews": false,
      "snippet": "China's industrial profits rose 21.1% in May compared to April's +24.7% increase. Profits for January-May climbed 18.8% over the corresponding period last...",
      "title": "China industrial profits stay resilient as economy leans on factories, exports",
      "publisher": "CNBC",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNVhNMDlXTkdWNFZWazVlRUZIVFJDZkF4ampCU2dLTWdZQlFKYTJJQWs=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNVhNMDlXTkdWNFZWazVlRUZIVFJDZkF4ampCU2dLTWdZQlFKYTJJQWs"
      }
    },
    {
      "newsUrl": "https://nypost.com/2026/06/28/lifestyle/parents-defend-enraged-dad-for-yelling-at-stranger-who-said-shut-up-to-teens/",
      "timestamp": "1782669060000",
      "hasSubnews": false,
      "snippet": "A father is going viral for stepping in to reprimand a stranger who yelled at teen girls traveling for the first time — and people online are praising him.",
      "title": "Fired up parents defend enraged dad for reprimanding stranger who said ‘shut up’ to teen girls",
      "publisher": "New York Post",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iL0NnNDBUMEZPVGpWWVMwOTNPVU5GVFJERUF4aW5CU2dLTWdtQkFaalNFT3FLUWdN=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iL0NnNDBUMEZPVGpWWVMwOTNPVU5GVFJERUF4aW5CU2dLTWdtQkFaalNFT3FLUWdN"
      }
    },
    {
      "newsUrl": "https://www.washingtonpost.com/business/2026/06/28/dollar-rises-ai-boom-fed-shift-despite-trump-impact/",
      "timestamp": "1782662400000",
      "hasSubnews": false,
      "snippet": "Foreign investors helped drive the dollar to a 13-month high this week, drawn by the AI boom and the prospect of a Fed rate increase later this year.",
      "title": "Dollar hits 13-month high as foreign investors overlook worries about Trump",
      "publisher": "The Washington Post",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNXpNSEJYYUdOSlVUSjBlamhCVFJERUF4aW1CU2dLTWdhQlk1YUVLZ2c=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNXpNSEJYYUdOSlVUSjBlamhCVFJERUF4aW1CU2dLTWdhQlk1YUVLZ2c"
      }
    },
    {
      "newsUrl": "https://www.cnbc.com/2026/06/28/ira-money-401k-rollovers.html",
      "timestamp": "1782653401000",
      "hasSubnews": false,
      "snippet": "Investors are increasingly rolling money from 401(k) plans to IRAs. Some observers fear they're exposed to poor investment advice.",
      "title": "IRAs hold trillions more than 401(k) plans — yet people hardly save in them",
      "publisher": "CNBC",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNDVhRU5zT0RGblVFdDJZMmRIVFJDZkF4ampCU2dLTWdhdFlZd3dwUWM=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNDVhRU5zT0RGblVFdDJZMmRIVFJDZkF4ampCU2dLTWdhdFlZd3dwUWM"
      }
    },
    {
      "newsUrl": "https://www.theverge.com/ai-artificial-intelligence/958804/chinas-z-ai-glm-52-mythos-cybersecurity",
      "timestamp": "1782682971000",
      "hasSubnews": false,
      "snippet": "China's Zhipu AI released GLM-5.2, which can apparently match Anthropic's Mythos on cybersecurity and bug-finding.",
      "title": "China’s Z.ai claims it can match Mythos on cybersecurity",
      "publisher": "The Verge",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iI0NnNTRTVFl4Y0VOTmJtSnNVVGxYVFJERUF4aW1CU2dLTWdB=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iI0NnNTRTVFl4Y0VOTmJtSnNVVGxYVFJERUF4aW1CU2dLTWdB"
      }
    },
    {
      "newsUrl": "https://www.theguardian.com/thefilter-us/2026/jun/28/tucktec-10-pro-folding-kayak-review",
      "timestamp": "1782666915000",
      "hasSubnews": false,
      "snippet": "The Tucktec 10 Pro is compact enough for a small car, quick enough for spontaneous trips, and inexpensive enough to open boating to everyone.",
      "title": "This $380 foldable kayak fits in my Prius and goes from backseat to lake in 10 minutes",
      "publisher": "The Guardian",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNU1SemhxY21WS2Rua3pZMjR5VFJEMEFoalJBeWdLTWdhSnBJcXV0UVk=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNU1SemhxY21WS2Rua3pZMjR5VFJEMEFoalJBeWdLTWdhSnBJcXV0UVk"
      }
    },
    {
      "newsUrl": "https://techcrunch.com/2026/06/28/ford-rehires-gray-beard-engineers-after-ai-falls-short/",
      "timestamp": "1782673539000",
      "hasSubnews": false,
      "snippet": "Ford executives said they have hired 350 veteran engineers — some of them were former employees, while others had been working at suppliers — after...",
      "title": "Ford rehires ‘gray beard’ engineers after AI falls short",
      "publisher": "TechCrunch",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNUZiVm94UXpoTFdHaFVaMmgzVFJERUF4aW1CU2dLTWdhQkVJb0tFZ3M=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNUZiVm94UXpoTFdHaFVaMmgzVFJERUF4aW1CU2dLTWdhQkVJb0tFZ3M"
      }
    },
    {
      "newsUrl": "https://onemileatatime.com/news/air-canada-plane-swerves-captain-incapacitated-mid-flight-emergency-diversion/",
      "timestamp": "1782649880000",
      "hasSubnews": false,
      "snippet": "An Air Canada Express flight reportedly \"swerved\" mid-flight, after the captain became incapacitated, leading to an emergency diversion.",
      "title": "Air Canada Plane \"Swerves\" As Captain Incapacitated Mid-Flight, Leading To Emergency Diversion",
      "publisher": "One Mile at a Time",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNHhVRUpDZFRSTWNsY3dhRTQyVFJEY0FSajNBaWdLTWdZQmdKZ1NNUWs=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNHhVRUpDZFRSTWNsY3dhRTQyVFJEY0FSajNBaWdLTWdZQmdKZ1NNUWs"
      }
    },
    {
      "newsUrl": "https://fortune.com/2026/06/28/google-sundar-pichai-larry-page-sergey-brin-crazy-trait-ai-ceo-success-trait-career-advice/",
      "timestamp": "1782644700000",
      "hasSubnews": false,
      "snippet": "When Arvind Jain, the now co-founder of Rubrik and Glean, landed a job at Google, he felt like an “imposter”. The engineer had moved to America from a small...",
      "title": "Ex-Google engineer says Larry Page, Sergey Brin and Sundar Pichai share the same 'crazy' trait",
      "publisher": "Fortune",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iL0NnNVpURFIxZDNWa015MWFSbEp0VFJERUF4aW1CU2dLTWdrQmNKQ3VLU2dlelFF=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iL0NnNVpURFIxZDNWa015MWFSbEp0VFJERUF4aW1CU2dLTWdrQmNKQ3VLU2dlelFF"
      }
    },
    {
      "newsUrl": "https://www.foxbusiness.com/lifestyle/nearly-1-million-bottles-heart-kidney-medication-recalled-over-foreign-substance-found-tablets",
      "timestamp": "1782640800000",
      "hasSubnews": false,
      "snippet": "Amgen recalled nearly one million bottles of Corlanor and Sensipar tablets after foreign matter was found on tablet surfaces, according to the FDA.",
      "title": "Nearly 1 million bottles of heart and kidney medication recalled over foreign substance found on tablets",
      "publisher": "Fox Business",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNUphM1JTYldkNUxUZDFTMUZxVFJDZkF4ampCU2dLTWdhQkFZaGdod3M=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNUphM1JTYldkNUxUZDFTMUZxVFJDZkF4ampCU2dLTWdhQkFZaGdod3M"
      }
    },
    {
      "newsUrl": "https://247wallst.com/personal-finance/2026/06/27/he-retired-at-66-with-a-pension-it-quietly-pushed-him-into-the-top-irmaa-bracket-for-life/",
      "timestamp": "1782574209000",
      "hasSubnews": false,
      "snippet": "A 66-year-old executive retires in 2024 with a $410,000 annual pension, $52,000 in Social Security, and roughly $50,000 in dividend and interest income.",
      "title": "He Retired at 66 With a Pension. It Quietly Pushed Him Into the Top IRMAA Bracket for Life.",
      "publisher": "24/7 Wall St.",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNUpVa2RFUkd0TE5XdDVWbmxuVFJERUF4aW1CU2dLTWdhWlVvQnBvZ2c=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNUpVa2RFUkd0TE5XdDVWbmxuVFJERUF4aW1CU2dLTWdhWlVvQnBvZ2c"
      }
    },
    {
      "newsUrl": "https://www.thestreet.com/technology/spcx-the-17-billion-spectrum-buy-finally-makes-sense-spacex",
      "timestamp": "1782550980000",
      "hasSubnews": false,
      "snippet": "SpaceX spent close to two years and nearly $20 billion buying wireless spectrum licenses that had nothing to do with rockets or satellite broadband.",
      "title": "The SpaceX $17 billion spectrum buy finally makes sense",
      "publisher": "thestreet.com",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNURlVlZxV1VaT1ZuTlFka3MyVFJDZkF4ampCU2dLTWdZQm9JYUZ3Z00=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNURlVlZxV1VaT1ZuTlFka3MyVFJDZkF4ampCU2dLTWdZQm9JYUZ3Z00"
      }
    },
    {
      "newsUrl": "https://cnevpost.com/2026/06/28/nio-pre-orders-5-seat-es8-jul-9-launch/",
      "timestamp": "1782616620000",
      "hasSubnews": false,
      "snippet": "The five-seat ES8 will sit alongside the existing six- and seven-seat versions, further expanding its top-selling SUV line.",
      "title": "Nio opens pre-orders for five-seat ES8, sets July 9 launch",
      "publisher": "CnEVPost",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNXdiSGxQWVhwVFZFNWZZM0ZWVFJDZkF4ampCU2dLTWdZaGc1Qk1NUVk=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNXdiSGxQWVhwVFZFNWZZM0ZWVFJDZkF4ampCU2dLTWdZaGc1Qk1NUVk"
      }
    },
    {
      "newsUrl": "https://www.bloomberg.com/news/articles/2026-06-27/tech-equity-sales-renew-ai-debt-binge-worries-credit-weekly",
      "timestamp": "1782586800000",
      "hasSubnews": false,
      "snippet": "Tech companies are selling stock like it's the dot-com boom, and some investors fear that's a bad sign for bondholders.",
      "title": "Tech Equity Sales Renew AI Debt-Binge Worries",
      "publisher": "Bloomberg.com",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNUliWEJITlZreE1sUnZUMkZsVFJEY0FoanNCQ2dLTWdZSnA1SkZ1Z1k=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNUliWEJITlZreE1sUnZUMkZsVFJEY0FoanNCQ2dLTWdZSnA1SkZ1Z1k"
      }
    },
    {
      "newsUrl": "https://www.ft.com/content/b68964c9-f3d0-48e8-8873-8f463834936c?syn-25a6b1a6=1",
      "timestamp": "1782558000000",
      "hasSubnews": false,
      "snippet": "German carmakers are embarking on their deepest ever restructuring to stem “the bleeding” from an influx of Chinese rivals that analysts warn could...",
      "title": "German carmakers embark on historic job cuts as Chinese rivals flood market",
      "publisher": "Financial Times",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNHdTWHBSU1RCMFNUVlhSM1pvVFJDZkF4ampCU2dLTWdZUkU1QW5sUW8=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNHdTWHBSU1RCMFNUVlhSM1pvVFJDZkF4ampCU2dLTWdZUkU1QW5sUW8"
      }
    },
    {
      "newsUrl": "https://www.wsj.com/tech/ai/china-resets-the-ai-race-572f6e07",
      "timestamp": "1782661680000",
      "hasSubnews": false,
      "snippet": "Plus, another primary win for Trump-backed candidates, and the World Cup reignites a long-running debate: Who lives better, Americans or Europeans?",
      "title": "China Resets the AI Race",
      "publisher": "WSJ",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNXFPR2xxTFhaQ1IxRmlTMk40VFJERUF4aW5CU2dLTWdZWlZaTHFxUWM=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNXFPR2xxTFhaQ1IxRmlTMk40VFJERUF4aW5CU2dLTWdZWlZaTHFxUWM"
      }
    },
    {
      "newsUrl": "https://financebuzz.com/average-retirement-savings-74-year-olds",
      "timestamp": "1782640800000",
      "hasSubnews": false,
      "snippet": "Millions of 74-year-olds have achieved financial security, but others struggle to make ends meet. Learn more about the average savings for older Americans.",
      "title": "Here's The Average Retirement Savings of 74-Year-Old Americans (How Do You Compare?)",
      "publisher": "FinanceBuzz",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNHpYMjE2Y21KbVlWVkRUMHR5VFJEN0FSamdBeWdLTWdZcFpZVE5MUVU=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNHpYMjE2Y21KbVlWVkRUMHR5VFJEN0FSamdBeWdLTWdZcFpZVE5MUVU"
      }
    },
    {
      "newsUrl": "https://wgntv.com/news/national/bought-beef-you-have-just-days-to-file-a-claim-in-87-5-million-settlement/",
      "timestamp": "1782651909000",
      "hasSubnews": false,
      "snippet": "(NEXSTAR) — The deadline to claim part of an $87.5 million settlement over beef products sold in more than half the U.S. over a five-year period is coming...",
      "title": "Bought beef? You have just days to file a claim in $87.5 million settlement",
      "publisher": "WGN-TV",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iMkNnNWZSbXR0UmtseE9DMWZVM0ZDVFJDb0F4alRCU2dLTWdzQkFJWkFsS1FWWXd2TlBR=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iMkNnNWZSbXR0UmtseE9DMWZVM0ZDVFJDb0F4alRCU2dLTWdzQkFJWkFsS1FWWXd2TlBR"
      }
    },
    {
      "newsUrl": "https://au.lifestyle.yahoo.com/aussie-sounds-alarm-over-scary-trend-with-smart-glasses-people-have-no-idea-070000464.html",
      "timestamp": "1782630000000",
      "hasSubnews": false,
      "snippet": "It's being dubbed a 'substantial' privacy risk for those not in the know.",
      "title": "Aussie sounds alarm over scary trend with smart glasses: 'People have no idea'",
      "publisher": "Yahoo Lifestyle Australia",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iL0NnNVBZbEZ4WDA1V01teERXbFJIVFJERUF4aW1CU2dLTWdtTk1KYkdLaWN1NVFJ=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iL0NnNVBZbEZ4WDA1V01teERXbFJIVFJERUF4aW1CU2dLTWdtTk1KYkdLaWN1NVFJ"
      }
    },
    {
      "newsUrl": "https://247wallst.com/personal-finance/2026/06/27/laid-off-at-57-she-faces-a-double-social-security-hit-years-of-zero-earnings-now-and-the-pull-to-claim-early-at-62/",
      "timestamp": "1782554474000",
      "hasSubnews": false,
      "snippet": "She is 57, single, and her job is gone. The role she held for years was eliminated, and the employment search has stretched longer than expected.",
      "title": "Laid Off at 57, She Faces a Double Social Security Hit: Years of Zero Earnings Now, and the Pull to Claim Early at 62",
      "publisher": "24/7 Wall St.",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNVpUMkZVV2xOMWMwRldVRmxtVFJDZkF4ampCU2dLTWdZNVk0NHlzUVk=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNVpUMkZVV2xOMWMwRldVRmxtVFJDZkF4ampCU2dLTWdZNVk0NHlzUVk"
      }
    },
    {
      "newsUrl": "https://www.wsj.com/business/airlines/airlines-are-installing-new-luxury-seats-but-no-one-is-allowed-to-sit-in-them-14e2878c",
      "timestamp": "1782639000000",
      "hasSubnews": false,
      "snippet": "Lie-flat seats in private pods face long waits for safety certifications.",
      "title": "Airlines Are Installing New Luxury Seats, but No One Is Allowed to Sit in Them",
      "publisher": "WSJ",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNVRRVlZaYjBoa05ISjRaVXA1VFJEZ0F4aUFCU2dLTWdZQlVJNHVzUVk=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNVRRVlZaYjBoa05ISjRaVXA1VFJEZ0F4aUFCU2dLTWdZQlVJNHVzUVk"
      }
    },
    {
      "newsUrl": "https://www.wcvb.com/article/golden-temple-closes-brookline/71756794",
      "timestamp": "1782587100000",
      "hasSubnews": false,
      "snippet": "A well-known Brookline restaurant announced on Instagram that it officially closed for good after over 60 years in business.",
      "title": "Beloved Brookline restaurant closes after over 60 years in business",
      "publisher": "WCVB",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iL0NnNU5kRkkxWDJwWmMxbGhWV1J2VFJDZ0F4amhCU2dLTWdrQmNJNEF0eVdpemdF=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iL0NnNU5kRkkxWDJwWmMxbGhWV1J2VFJDZ0F4amhCU2dLTWdrQmNJNEF0eVdpemdF"
      }
    },
    {
      "newsUrl": "https://www.marthastewart.com/most-expensive-air-conditioner-setting-12005705",
      "timestamp": "1782561600000",
      "hasSubnews": false,
      "snippet": "Trying to stay cool during a heat wave? Experts reveal the AC setting that can drive up energy costs the most—and what to use instead to save money.",
      "title": "The Most Expensive AC Setting to Use During a Heat Wave, Experts Say",
      "publisher": "marthastewart.com",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNWpTR0ZmWmt4Q1ZGTmhhek00VFJESEF4aWlCU2dLTWdZQmM0WXpLUWc=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNWpTR0ZmWmt4Q1ZGTmhhek00VFJESEF4aWlCU2dLTWdZQmM0WXpLUWc"
      }
    },
    {
      "newsUrl": "https://www.nytimes.com/2026/06/27/nyregion/united-plane-pilot-drone-newark.html",
      "timestamp": "1782589736000",
      "hasSubnews": false,
      "snippet": "The crew of a Boeing 737 arriving from Florida on Friday reported a drone in the airspace as the plane approached Newark Airport. The plane landed safely.",
      "title": "F.A.A. Investigates Drone Encounter at Newark Airport",
      "publisher": "The New York Times",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNWxNVGRLYlhoblJYTklPR0oyVFJDUUF4allCQ2dLTWdZSllJcHdKUWs=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNWxNVGRLYlhoblJYTklPR0oyVFJDUUF4allCQ2dLTWdZSllJcHdKUWs"
      }
    },
    {
      "newsUrl": "https://www.thestreet.com/retirement/vanguard-401k-auto-enrollment-record-participation-2026",
      "timestamp": "1782682620000",
      "hasSubnews": false,
      "snippet": "For decades, weak willpower has been widely viewed as a primary barrier to retirement readiness. But 25 years of data from Vanguard suggest the story may be...",
      "title": "Vanguard’s 25 years of data upend major retirement myth",
      "publisher": "thestreet.com",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNW9PSFkxWTI1ck9ISkhZWEUwVFJDZkF4ampCU2dLTWdhdE5JaXVuUWc=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNW9PSFkxWTI1ck9ISkhZWEUwVFJDZkF4ampCU2dLTWdhdE5JaXVuUWc"
      }
    },
    {
      "newsUrl": "https://www.cnet.com/roadshow/news/polestar-ev-ban-commerce-department-volvo-china/",
      "timestamp": "1782560280000",
      "hasSubnews": false,
      "snippet": "Automaker Polestar will not be allowed to sell its 2027 models and beyond in the US after the US Department of Commerce's Bureau of Industry and Security...",
      "title": "Polestar Faces a Ban on Selling Its EVs in the US",
      "publisher": "CNET",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNTBNMFUyT1RWM1dHNUVhVTF4VFJDZkF4ampCU2dLTWdhUjRvcXRSUVU=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNTBNMFUyT1RWM1dHNUVhVTF4VFJDZkF4ampCU2dLTWdhUjRvcXRSUVU"
      }
    },
    {
      "newsUrl": "https://apnews.com/article/vespa-italy-rome-80th-anniversary-colosseum-cd10e17362ad85818ceba5123ebc4e52",
      "timestamp": "1782577320000",
      "hasSubnews": false,
      "snippet": "Around 15000 Vespas buzzed through Rome on Saturday, celebrating the scooter's 80th anniversary. Enthusiasts from Europe, the US, Australia and the...",
      "title": "Thousands of Vespas swarm Rome’s historic center to mark iconic scooter’s 80th anniversary",
      "publisher": "AP News",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNW5hVlJYWkUxVlgwdE9WelIxVFJDUEF4alhCQ2dLTWdZQnNJYnF6QU0=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNW5hVlJYWkUxVlgwdE9WelIxVFJDUEF4alhCQ2dLTWdZQnNJYnF6QU0"
      }
    },
    {
      "newsUrl": "https://www.foxnews.com/tech/fbi-warns-microsoft-users-passwordless-scam",
      "timestamp": "1782654829000",
      "hasSubnews": false,
      "snippet": "Microsoft 365 accounts are being targeted by a phishing platform called Kali365 that can bypass MFA, the FBI warns. Here's how to protect your account.",
      "title": "FBI warns Microsoft users about passwordless scam",
      "publisher": "Fox News",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNXRla3RJVjFKRVgxOUVibmh5VFJDZkF4ampCU2dLTWdZVkpJcXFGUVE=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNXRla3RJVjFKRVgxOUVibmh5VFJDZkF4ampCU2dLTWdZVkpJcXFGUVE"
      }
    },
    {
      "newsUrl": "https://electrek.co/2026/06/28/survey-sunday-with-nearly-a-trillion-dollars-will-elon-try-to-make-things-right/",
      "timestamp": "1782663180000",
      "hasSubnews": false,
      "snippet": "Last week, we asked Electrek readers a simple whether they believed that Tesla and SpaceX CEO Elon Musk, after becoming the world's first trillionaire,...",
      "title": "Survey Sunday: with nearly a trillion dollars, will Elon try to make things right?",
      "publisher": "Electrek",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNWlha3N5UWpOcU5HcEJRWFI2VFJDSEF4aVBCaWdLTWdhcE5JaU5NUVE=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNWlha3N5UWpOcU5HcEJRWFI2VFJDSEF4aVBCaWdLTWdhcE5JaU5NUVE"
      }
    },
    {
      "newsUrl": "https://www.cnbc.com/2026/06/28/google-limits-metas-use-of-its-gemini-ai-models-ft-reports.html",
      "timestamp": "1782642627000",
      "hasSubnews": false,
      "snippet": "Meta had sought more computing capacity than Google could provide, the Financial Times reports.",
      "title": "Google limits Meta’s use of its Gemini AI models, FT reports",
      "publisher": "CNBC",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNXVhVGsxZGxSRVQyOXljREExVFJDZkF4ampCU2dLTWdhTkVvcktMUVU=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNXVhVGsxZGxSRVQyOXljREExVFJDZkF4ampCU2dLTWdhTkVvcktMUVU"
      }
    },
    {
      "newsUrl": "https://www.forbes.com/sites/zacharyfolk/2026/06/28/northern-lights-forecast-aurora-could-be-visible-from-these-nine-states-monday/",
      "timestamp": "1782657753000",
      "hasSubnews": false,
      "snippet": "Although the northern lights likely won't be visible on Sunday night, expected geomagnetic storms could make the aurora reappear further south on Monday.",
      "title": "Northern Lights Forecast: Here’s Where The Aurora Could Be Visible Next Week",
      "publisher": "Forbes",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iJ0NnNXFabWxPYW01SVNGWnBZMjFzVFJDUEF4akdCU2dLTWdPQktRTQ=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iJ0NnNXFabWxPYW01SVNGWnBZMjFzVFJDUEF4akdCU2dLTWdPQktRTQ"
      }
    },
    {
      "newsUrl": "https://electrek.co/2026/06/28/controversial-ferrari-luce-ev-is-an-instant-sellout-in-china/",
      "timestamp": "1782674820000",
      "hasSubnews": false,
      "snippet": "All the controversy surrounding the launch of the first all-electric sedan to ever wear the Ferrari badge hasn't slowed down sales any – every single...",
      "title": "Controversial Ferrari Luce EV is an instant sellout in China",
      "publisher": "Electrek",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNXhiVFJaTFV0R1NXZHdNbEZSVFJDSEF4aVBCaWdLTWdhSklaSk1uUVk=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNXhiVFJaTFV0R1NXZHdNbEZSVFJDSEF4aVBCaWdLTWdhSklaSk1uUVk"
      }
    },
    {
      "newsUrl": "https://abc11.com/post/potato-chip-recall-upgraded-highest-fda-risk-level-salmonella-concerns/19397108/",
      "timestamp": "1782589224000",
      "hasSubnews": false,
      "snippet": "FDA upgrades recall of Zapp's and Dirty potato chips to highest risk level over possible salmonella contamination.",
      "title": "Potato chip recall upgraded to highest FDA risk level over salmonella concerns",
      "publisher": "ABC11 News",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iJ0NnNVhRbGR6V2xRd1JUY3pkMjVEVFJDZkF4ampCU2dLTWdPUlFnbw=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iJ0NnNVhRbGR6V2xRd1JUY3pkMjVEVFJDZkF4ampCU2dLTWdPUlFnbw"
      }
    },
    {
      "newsUrl": "https://www.thestreet.com/retirement/401k-withdrawal-planning-gap-retirement-income",
      "timestamp": "1782656220000",
      "hasSubnews": false,
      "snippet": "American workers have steadily built up 401(k) balances, but new research suggests they remain poorly prepared to spend down those savings once paychecks...",
      "title": "Retirees face surprising problem with 401(k)s",
      "publisher": "thestreet.com",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNUxjRGhoWmxWSWJYTlVURUpPVFJDZkF4ampCU2dLTWdhdEZJU3ZsUW8=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNUxjRGhoWmxWSWJYTlVURUpPVFJDZkF4ampCU2dLTWdhdEZJU3ZsUW8"
      }
    },
    {
      "newsUrl": "https://www.teslarati.com/tesla-q2-delivery-consensus-confirms-this-long-standing-theory/",
      "timestamp": "1782634681000",
      "hasSubnews": false,
      "snippet": "Tesla released what analysts believe the company will report in terms of deliveries and energy deployments for Q2, but the figures seem to confirm a...",
      "title": "Tesla Q2 delivery consensus confirms this long-standing theory",
      "publisher": "Teslarati",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNDNNRlJHWkRrNFF5MXJaMDlsVFJDZkF4ampCU2dLTWdZQlVJcU5zQVk=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNDNNRlJHWkRrNFF5MXJaMDlsVFJDZkF4ampCU2dLTWdZQlVJcU5zQVk"
      }
    },
    {
      "newsUrl": "https://www.deseret.com/u-s-world/2026/06/26/idaho-national-labs-nuclear-250/",
      "timestamp": "1782529200000",
      "hasSubnews": false,
      "snippet": "America's nuclear renaissance is about transforming nuclear power from slow, one-off construction projects into scalable, factory-built reactors.",
      "title": "The reactor race has begun",
      "publisher": "Deseret News",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNUlhMWcxTFdvM1RrWTJabEF4VFJERUF4aW5CU2dLTWdZSm9JcDVPQWM=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNUlhMWcxTFdvM1RrWTJabEF4VFJERUF4aW5CU2dLTWdZSm9JcDVPQWM"
      }
    },
    {
      "newsUrl": "https://www.oregonlive.com/business/2026/06/oregons-minimum-wage-rises-wednesday-but-the-pay-hike-reaches-a-smaller-share-of-the-workforce.html",
      "timestamp": "1782655320000",
      "hasSubnews": false,
      "snippet": "Minimum-wage workers get a pay bump Wednesday, with wages rising 50 cents an hour across Oregon to keep pace with inflation.",
      "title": "Oregon’s minimum wage rises Wednesday, but the pay hike reaches a smaller share of the workforce",
      "publisher": "OregonLive.com",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNXJWVXBMT1VwUllsZFdhMWc1VFJEZ0F4aUFCU2dLTWdZNUlvWHkyQUk=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNXJWVXBMT1VwUllsZFdhMWc1VFJEZ0F4aUFCU2dLTWdZNUlvWHkyQUk"
      }
    },
    {
      "newsUrl": "https://www.thestreet.com/retail/97-year-old-heinens-grocery-chain-closes-historic-location",
      "timestamp": "1782677072000",
      "hasSubnews": false,
      "snippet": "The family-owned grocery store chain said the location was not sustainable to continue operating.",
      "title": "97-year-old supermarket chain closes historic location",
      "publisher": "thestreet.com",
      "images": {
        "thumbnail": "https://news.google.com/api/attachments/CC8iK0NnNDNPRFJsVlRZd2JWZ3hWVU0zVFJDZkF4ampCU2dLTWdhQkFJNk1NUVk=-w280-h168-p-df-rw",
        "thumbnailProxied": "https://img.devisty.store/newsimage/CC8iK0NnNDNPRFJsVlRZd2JWZ3hWVU0zVFJDZkF4ampCU2dLTWdhQkFJNk1NUVk"
      }
    }
  ]
}
```