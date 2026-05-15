# frozen_string_literal: true

require 'nokogiri'

Jekyll::Hooks.register [:pages, :documents], :post_render do |doc|
  convert_links(doc)
end

def convert_links(doc)
  return unless doc.site.config['open_external_links_in_new_tab']
  return if doc.output.nil? || doc.output.empty?

  parsed_doc = Nokogiri::HTML::DocumentFragment.parse(doc.output)
  parsed_doc.css('a:not(.internal-link):not(.footnote):not(.reversefootnote)').each do |link|
    href = link['href'].to_s
    next if href.start_with?('#', 'mailto:', 'tel:')
    next if href.start_with?(doc.site.config['baseurl'].to_s)

    link.set_attribute('target', '_blank')
    link.set_attribute('rel', 'noopener noreferrer')
  end

  doc.output = parsed_doc.inner_html
end
