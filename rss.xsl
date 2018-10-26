<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:atom="http://www.w3.org/2005/Atom"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:rss1="http://purl.org/rss/1.0/"
    exclude-result-prefixes="atom rdf" >

    <xsl:output method="html" indent="yes" encoding="utf-8" />


    <xsl:template match="channel | atom:feed | rss1:channel">


      <div id="feedTitle">
        <a id="feedTitleLink">
          <img id="feedTitleImage" src="{image/url | atom:logo | rss1:image/rss1:url }" />
        </a>
        <div id="feedTitleContainer">
          <h1 id="feedTitleText" >
            <a href="{link | atom:link[@rel='alternate']/@href | rss1:link}" target="_blank">
            <img src="icons/home.png" class="headerIcon" />
            <xsl:value-of select="title | atom:title | rss1:title" />
            </a>
          </h1>
          <h2 id="feedSubtitleText" ><xsl:value-of select="description | atom:subtitle | rss1:description" /></h2>
          <!--div class="lastUpdated">Last updated: <xsl:value-of select="lastBuildDate | atom:updated" /></div-->
        </div>
      </div>


      <div id="feedContent">
        <xsl:apply-templates select="item | atom:entry " />
      </div>

    </xsl:template>

    <xsl:template match="item | atom:entry | rss1:item">

        <div class="entry">

            <h3>
                <xsl:choose>
                  <xsl:when test="link | atom:link[@rel='alternate']/@href | rss1:link">
                    <a href="{link | atom:link[@rel='alternate']/@href | rss1:link}" target="_blank">
                        <span><xsl:value-of select="title | atom:title | rss1:title" /></span>
                    </a>
                  </xsl:when>
                  <xsl:otherwise>
                    <span><xsl:value-of select="title | atom:title | rss1:link" /></span>
                  </xsl:otherwise>
                </xsl:choose>

                <div class="lastUpdated"><xsl:value-of select="pubDate | atom:updated | rss1:pubDate" /></div>
            </h3>
            <div class="feedEntryContent">
                <xsl:value-of select="description | atom:summary | rss1:description" disable-output-escaping="yes" />
            </div>
            <div class="enclosures">
                <xsl:for-each select="enclosure | atom:link[@rel='enclosure'] | rss1:enclosure">

                  <div class="enclosure">
                      <img src="icons/file.png" class="enclosureIcon" />
                      <a href="{@url | @href}" target="_blank" class="enclosureFilename"><xsl:value-of select="@url | @href" /></a>
                      (<xsl:value-of select="@type" />, <span class="enclosureSize"><xsl:value-of select="@length" /></span>)
                  </div>

                </xsl:for-each>
            </div>

        </div>
        <div style="clear: both;"></div>

    </xsl:template>


    <xsl:template match="/">
         <xsl:apply-templates select="//channel | //atom:feed | //rss1:channel " />
         <xsl:apply-templates select="//rss1:item " />
    </xsl:template>

</xsl:stylesheet>
