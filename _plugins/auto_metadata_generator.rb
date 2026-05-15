# frozen_string_literal: true

# AutoMetadataGenerator
# Computes approximate word counts and reading time for blog documents at
# build time and injects them into the document's `data` hash when missing.
# This avoids client-side counting and makes the `min-read` and `words`
# front-matter optional for authors.

module Jekyll
  class AutoMetadataGenerator < Generator
    safe true
    priority :low

    def generate(site)
      default_author = site.config['author'] || site.config['default_author'] || nil

      docs = []
      # collect candidate documents: pages and collection docs
      docs.concat(site.pages)
      site.collections.each_value do |coll|
        docs.concat(coll.docs)
      end

      docs.each do |doc|
        begin
          # Only process likely blog items: in a '_blogs' folder, collection named 'blogs',
          # or layout equals 'blog'. Skip drafts and already generated pages.
          next unless doc.respond_to?(:content) && doc.content
          path = (doc.path || '').downcase
          coll = doc.respond_to?(:collection) && doc.collection ? doc.collection.label.to_s : ''
          layout = (doc.data['layout'] || '').to_s.downcase

          is_blog = path.include?('_blogs/') || coll == 'blogs' || layout == 'blog' || (doc.url && doc.url.start_with?('/blogs'))
          slug = doc.data['slug'].to_s
          is_quest = layout == 'quest' || (path.include?('quests/') && slug != 'index')
          is_journal = layout == 'journal-year' || (path.include?('journal/') && slug != 'index')
          next unless is_blog || is_quest || is_journal

          # compute approximate words only if not provided
          if doc.data['words'].nil? || doc.data['words'].to_s.empty?
            words = approximate_word_count(doc.content)
            doc.data['words'] = words
          end

          if doc.data['min-read'].nil? || doc.data['min-read'].to_s.empty?
            # 200 words per minute estimate
            min_read = [(doc.data['words'].to_f / 200.0).ceil, 1].max
            doc.data['min-read'] = min_read
          end

          if (doc.data['author'].nil? || doc.data['author'].to_s.strip.empty?) && default_author
            doc.data['author'] = default_author
          end
        rescue => e
          Jekyll.logger.warn "AutoMetadataGenerator:", "failed for #{doc.path}: #{e.message}"
        end
      end
    end

    private

    # Lightweight approximate word count from raw markdown
    def approximate_word_count(text)
      return 0 unless text

      s = text.dup
      # remove fenced code blocks
      s.gsub!(/```[\s\S]*?```/, ' ')
      # remove HTML tags
      s.gsub!(/<[^>]*>/, ' ')
      # remove wikilinks and keep label
      s.gsub!(/\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/, '\1')
      # remove markdown links but keep text
      s.gsub!(/\[([^\]]+)\]\([^\)]+\)/, '\1')
      # remove punctuation except word separators
      s.gsub!(/[^\p{L}\p{N}\s']+/u, ' ')
      # collapse whitespace and split
      s = s.split(/\r?\n/).map(&:strip).join(' ')
      words = s.strip.split(/\s+/).select { |w| w && w.length > 0 }
      count = words.length
      if count == 0
        count = s.split(/\b/).count { |tok| tok =~ /\w/ }
      end
      count
    end
  end
end
