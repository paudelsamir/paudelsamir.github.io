# frozen_string_literal: true

require 'nokogiri'

Jekyll::Hooks.register [:pages, :documents], :post_render do |doc|
  embed_media(doc)
end

def embed_media(doc)
  return if doc.output.nil? || doc.output.empty?

  parsed_doc = Nokogiri::HTML::DocumentFragment.parse(doc.output)

  parsed_doc.css('p').each do |paragraph|
    next unless paragraph.children.length == 1

    child = paragraph.children.first
    href = nil

    if child.text?
      text = child.text.strip
      href = text if text.match?(%r{^https?://})
    elsif child.name == 'a'
      href = child['href'].to_s
    end

    next if href.nil? || href.empty?

    replacement = build_embed_fragment(href, parsed_doc)
    next unless replacement

    paragraph.replace(replacement)
  end

  doc.output = parsed_doc.to_html
end

def build_embed_fragment(href, doc)
  return youtube_embed(href, doc) if youtube_url?(href)
  return vimeo_embed(href, doc) if vimeo_url?(href)
  return twitter_embed(href, doc) if twitter_url?(href)
  return media_tag_embed(href, doc) if media_file?(href)

  nil
end

def youtube_url?(href)
  href.match?(%r{https?://(www\.)?(youtube\.com/watch\?v=|youtu\.be/)[A-Za-z0-9_-]+})
end

def vimeo_url?(href)
  href.match?(%r{https?://(www\.)?vimeo\.com/\d+})
end

def twitter_url?(href)
  href.match?(%r{https?://(www\.)?(twitter\.com|x\.com)/[^/]+/status/\d+})
end

def media_file?(href)
  href.match?(%r{\.(mp3|wav|ogg|m4a|mp4|webm|mov)(\?.*)?$}i)
end

def youtube_embed(href, doc)
  video_id = href[%r{(?:v=|youtu\.be/)([A-Za-z0-9_-]+)}, 1]
  return nil if video_id.nil?

  Nokogiri::HTML::DocumentFragment.parse(<<~HTML)
    <div class="video-embed youtube-embed">
      <iframe
        src="https://www.youtube.com/embed/#{video_id}"
        title="YouTube video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>
    </div>
  HTML
end

def vimeo_embed(href, doc)
  video_id = href[%r{vimeo\.com/(\d+)}, 1]
  return nil if video_id.nil?

  Nokogiri::HTML::DocumentFragment.parse(<<~HTML)
    <div class="video-embed vimeo-embed">
      <iframe
        src="https://player.vimeo.com/video/#{video_id}"
        title="Vimeo video"
        loading="lazy"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen></iframe>
    </div>
  HTML
end

def twitter_embed(href, doc)
  Nokogiri::HTML::DocumentFragment.parse(<<~HTML)
    <blockquote class="twitter-tweet">
      <a href="#{href}">View on X/Twitter</a>
    </blockquote>
    <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
  HTML
end

def media_tag_embed(href, doc)
  if href.match?(%r{\.(mp3|wav|ogg|m4a)(\?.*)?$}i)
    Nokogiri::HTML::DocumentFragment.parse(%(<audio controls src="#{href}"></audio>))
  else
    Nokogiri::HTML::DocumentFragment.parse(%(<video controls playsinline src="#{href}"></video>))
  end
end
