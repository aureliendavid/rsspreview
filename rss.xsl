<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:atom="http://www.w3.org/2005/Atom" exclude-result-prefixes="atom" >

    <xsl:output method="html" indent="yes" encoding="utf-8" />


    <xsl:template match="channel | atom:feed">


      <div id="feedTitle">
        <a id="feedTitleLink">
          <img id="feedTitleImage" src="{image/url | atom:logo}" />
        </a>
        <div id="feedTitleContainer">
          <h1 id="feedTitleText" >
            <a href="{link | atom:link[@rel='alternate']/@href}" target="_blank">
            <xsl:value-of select="title | atom:title" />
            </a>
          </h1>
          <h2 id="feedSubtitleText" ><xsl:value-of select="description | atom:subtitle" /></h2>
          <!--div class="lastUpdated">Last updated: <xsl:value-of select="lastBuildDate | atom:updated" /></div-->
        </div>
      </div>


      <div id="feedContent">

        <xsl:for-each select="item | atom:entry">

            <div class="entry">

                <h3>
                    <xsl:choose>
                      <xsl:when test="link | atom:link[@rel='alternate']/@href">
                        <a href="{link | atom:link[@rel='alternate']/@href}" target="_blank">
                            <span><xsl:value-of select="title | atom:title" /></span>
                        </a>
                      </xsl:when>
                      <xsl:otherwise>
                        <span><xsl:value-of select="title | atom:title" /></span>
                      </xsl:otherwise>
                    </xsl:choose>

                    <div class="lastUpdated"><xsl:value-of select="pubDate | atom:updated" /></div>
                </h3>
                <div class="feedEntryContent">
                    <xsl:value-of select="description | atom:summary" disable-output-escaping="yes" />
                </div>
                <div class="enclosures">
                    <xsl:for-each select="enclosure | atom:link[@rel='enclosure']">

                      <div class="enclosure">
                          <img src="icons/file.png" class="enclosureIcon" />
                          <a href="{@url | @href}" target="_blank" class="enclosureFilename"><xsl:value-of select="@url | @href" /></a>
                          (<xsl:value-of select="@type" />, <span class="enclosureSize"><xsl:value-of select="@length" /></span>)
                      </div>

                    </xsl:for-each>
                </div>

            </div>
            <div style="clear: both;"></div>

        </xsl:for-each>

      </div>

    </xsl:template>


    <xsl:template match="/">
         <xsl:apply-templates select="//channel | //atom:feed" />
    </xsl:template>

</xsl:stylesheet>
