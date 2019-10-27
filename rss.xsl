<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:atom="http://www.w3.org/2005/Atom"
    xmlns:atom03="http://purl.org/atom/ns#"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:rss1="http://purl.org/rss/1.0/"
    xmlns:media="http://search.yahoo.com/mrss/"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:content="http://purl.org/rss/1.0/modules/content/"
    exclude-result-prefixes="atom atom03 rdf rss1 media dc content" >

    <xsl:param name="fullPreview" />
    <xsl:param name="doAuthor" />

    <xsl:output method="html" indent="yes" encoding="utf-8" />

    <xsl:template match="channel | rss1:channel | atom:feed | atom03:feed">


      <div id="feedTitle">
        <a id="feedTitleLink">
          <img id="feedTitleImage" src="{image/url | rss1:image/rss1:url | atom:logo | atom03:logo }" />
        </a>
        <div id="feedTitleContainer">
          <h1 id="feedTitleText" >
            <a href="{link | rss1:link | atom:link[@rel='alternate']/@href | atom03:link[@rel='alternate']/@href}" target="_blank">
            <xsl:value-of select="title | rss1:title | atom:title | atom03:title" />
            </a>
          </h1>
          <h2 id="feedSubtitleRaw" ><xsl:value-of select="description | rss1:description | atom:subtitle | atom03:subtitle" /></h2>
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
                  <xsl:when test="atom:link[@rel='alternate']/@href | atom03:link[@rel='alternate']/@href">
                    <a href="{atom:link[@rel='alternate']/@href | atom03:link[@rel='alternate']/@href}" target="_blank">
                        <span class="entrytitle"><xsl:value-of select="atom:title | atom03:title" /></span>
                    </a>
                  </xsl:when>
                  <xsl:when test="link | rss1:link | atom:link/@href | atom03:link/@href">
                    <a href="{link | rss1:link | atom:link/@href | atom03:link/@href}" target="_blank">
                        <span class="entrytitle"><xsl:value-of select="title | rss1:title | atom:title | atom03:title" /></span>
                    </a>
                  </xsl:when>
                  <xsl:otherwise>
                    <span class="entrytitle"><xsl:value-of select="title | rss1:link | atom:title | atom03:title" /></span>
                  </xsl:otherwise>
                </xsl:choose>

                <div class="lastUpdated"><xsl:value-of select="pubDate | rss1:pubDate | atom:updated | atom03:updated" /></div>

                <xsl:if test="$doAuthor">
                  <div class="author"><xsl:value-of select="dc:creator | author | rss1:author | atom:*/atom:name | atom03:*/atom03:name" /></div>
                </xsl:if>
            </h3>

            <xsl:if test='.//media:thumbnail/@url'>
                <img class="mediaThumb" src="{ .//media:thumbnail/@url }" width="{ .//media:thumbnail/@width }" height="{ .//media:thumbnail/@height }" />
            </xsl:if>

            <xsl:choose>
              <xsl:when test="not($fullPreview)">
                <xsl:choose>
                  <xsl:when test="description | rss1:description | atom:summary | atom03:summary">
                    <div class="feedRawContent" desctype="{atom:summary/@type | atom03:summary/@type }">
                        <xsl:copy-of select="description | rss1:description | atom:summary | atom03:summary"  />
                    </div>
                  </xsl:when>
                  <xsl:otherwise>
                    <div class="feedRawContent" desctype="{atom:content/@type | atom03:content/@type }">
                        <xsl:copy-of select="content:encoded | rss1:description | atom:content | atom03:content"  />
                    </div>
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:when>
              <xsl:otherwise>
                <xsl:choose>
                  <xsl:when test="content:encoded | rss1:description | atom:content | atom03:content">
                    <div class="feedRawContent" desctype="{atom:content/@type | atom03:content/@type }">
                        <xsl:copy-of select="content:encoded | rss1:description | atom:content | atom03:content"  />
                    </div>
                  </xsl:when>
                  <xsl:otherwise>
                    <div class="feedRawContent" desctype="{atom:summary/@type | atom03:summary/@type }">
                        <xsl:copy-of select="description | rss1:description | atom:summary | atom03:summary"  />
                    </div>
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:otherwise>
            </xsl:choose>

            <div class="enclosures">
                <xsl:for-each select="enclosure | rss1:enclosure | atom:link[@rel='enclosure'] | atom03:link[@rel='enclosure']">

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
