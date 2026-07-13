# WebSpider

I want to add a new project.
It will be a web spider program. It will connect to the database using the same settings as 'news-api\.env.local', and look for articles. It will randomly pick articles one at a time and do the following process:

- Check to see if the article has been processed.
 - If the article has NOT been processed:
  - Download the article HTML
  - Download the article text
  - Insert the article HTML and text into an Article Data table
  - Link the Article Data table with the table that we use to store articles from the API.

The article link to the raw text and html will serve as the article having been processed.

Let's start a new branch and get started on the new project.
