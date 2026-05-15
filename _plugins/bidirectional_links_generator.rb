# frozen_string_literal: true

class BidirectionalLinksGenerator < Jekyll::Generator
  safe true

  def generate(site)
    docs = (site.documents + site.pages).select { |doc| doc.respond_to?(:content) && doc.respond_to?(:url) }
    link_extension = site.config['use_html_extension'] ? '.html' : ''
    index = build_index(docs)

    docs.each do |doc|
      next if doc.content.nil? || doc.content.empty?

      replace_wikilinks(doc, index, site, link_extension)
    end

    docs.each do |doc|
      next if doc.content.nil? || doc.content.empty?

      backlinks = docs.filter do |other|
        other.url != doc.url && other.content && other.content.include?(doc.url)
      end

      doc.data['backlinks'] = backlinks
    end
  end

  private

  def build_index(docs)
    index = {}

    docs.each do |doc|
      url = doc.url
      next if url.nil? || url.empty?

      basename = File.basename(doc.basename.to_s, File.extname(doc.basename.to_s))
      title = doc.data['title'].to_s
      slug = doc.data['slug'].to_s

      [basename, title, slug].each do |key|
        next if key.nil? || key.empty?

        index[normalize_key(key)] = url
      end
    end

    index
  end

  def replace_wikilinks(doc, index, site, link_extension)
    doc.content.gsub!(/\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/) do
      target_text = Regexp.last_match(1).strip
      label = (Regexp.last_match(2) || target_text).strip
      target_url = resolve_target(target_text, index)

      if target_url
        href = "#{site.baseurl}#{target_url}#{link_extension}"
        %(<a class="internal-link has-preview" href="#{href}" data-preview-url="#{href}">#{label}</a>)
      else
        target_text
      end
    end
  end

  def resolve_target(text, index)
    normalized = normalize_key(text)
    return index[normalized] if index.key?(normalized)

    variations = [
      normalized.tr('_', '-'),
      normalized.tr('-', ' '),
      normalized.tr(' ', '-'),
      normalized.gsub(/[^a-z0-9\s-]/, '')
    ]

    variations.each do |candidate|
      return index[candidate] if index.key?(candidate)
    end

    nil
  end

  def normalize_key(text)
    text.to_s.downcase.strip
  end
end
