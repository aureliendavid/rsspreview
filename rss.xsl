<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:atom="http://www.w3.org/2005/Atom"
    xmlns:atom03="http://purl.org/atom/ns#"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:rss1="http://purl.org/rss/1.0/"
    xmlns:media="http://search.yahoo.com/mrss/"
    exclude-result-prefixes="atom atom03 rdf rss1 media" >

    <xsl:param name="fullPreview" />

    <xsl:output method="html" indent="yes" encoding="utf-8" />

    <xsl:template match="channel | atom:feed | atom03:feed | rss1:channel">


      <div id="feedTitle">
        <a id="feedTitleLink">
          <img id="feedTitleImage" src="{image/url | atom:logo | atom03:logo | rss1:image/rss1:url }" />
        </a>
        <div id="feedTitleContainer">
          <h1 id="feedTitleText" >
            <a href="{link | atom:link[@rel='alternate']/@href | atom03:link[@rel='alternate']/@href | rss1:link}" target="_blank">
            <xsl:value-of select="title | atom:title | atom03:title | rss1:title" />
            </a>
          </h1>
          <h2 id="feedSubtitleRaw" ><xsl:value-of select="description | atom:subtitle | atom03:subtitle | rss1:description" /></h2>
        </div>
      </div>


      <div id="feedContent">
        <xsl:apply-templates select="item | atom:entry | atom03:entry " />
      </div>

    </xsl:template>

    <xsl:template match="item | atom:entry | atom03:entry | rss1:item">

        <div class="entry">

            <h3>
                <xsl:choose>
                  <xsl:when test="link | atom:link/@href | atom03:link/@href | rss1:link">
                    <a href="{link | atom:link/@href | atom03:link/@href | rss1:link}" target="_blank">
                        <span class="entrytitle"><xsl:value-of select="title | atom:title | atom03:title | rss1:title" /></span>
                    </a>
                  </xsl:when>
                  <xsl:otherwise>
                    <span class="entrytitle"><xsl:value-of select="title | atom:title | atom03:title | rss1:link" /></span>
                  </xsl:otherwise>
                </xsl:choose>

                <div class="lastUpdated"><xsl:value-of select="pubDate | atom:updated | atom03:updated | rss1:pubDate" /></div>
            </h3>

            <xsl:if test='.//media:thumbnail/@url'>
                <img class="mediaThumb" src="{ .//media:thumbnail/@url }" width="{ .//media:thumbnail/@width }" height="{ .//media:thumbnail/@height }" />
            </xsl:if>
            <xsl:choose>
              <xsl:when test="not($fullPreview) and atom:summary | atom03:summary">
                <div class="feedRawContent" desctype="{atom:summary/@type | atom03:summary/@type }">
                    <xsl:copy-of select="atom:summary | atom03:summary"  />
                </div>
              </xsl:when>
              <xsl:otherwise>
                <div class="feedRawContent" desctype="{atom:content/@type | atom03:content/@type }">
                    <xsl:copy-of select="description | atom:content | atom03:content | rss1:description"  />
                </div>
              </xsl:otherwise>
            </xsl:choose>

            <div class="enclosures">
                <xsl:for-each select="enclosure | atom:link[@rel='enclosure'] | atom03:link[@rel='enclosure'] | rss1:enclosure">

                  <div class="enclosure">
                      <img data-src="icons/file.png" class="extImg enclosureIcon" />
                      <a href="{@url | @href}" target="_blank" class="enclosureFilename"><xsl:value-of select="@url | @href" /></a>
                      (<xsl:value-of select="@type" />, <span class="enclosureSize"><xsl:value-of select="@length" /></span>)
                  </div>

                </xsl:for-each>
            </div>

        </div>
        <div style="clear: both;"></div>

    </xsl:template>


    <xsl:template match="/">
         <xsl:apply-templates select="//channel | //atom:feed | //atom03:feed | //rss1:channel " />
         <xsl:apply-templates select="//rss1:item " />
    </xsl:template>

</xsl:stylesheet>
