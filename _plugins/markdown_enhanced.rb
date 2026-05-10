module Jekyll
  module MarkdownEnhanced
    # Convert markdown-it style syntax to HTML
    # ^text^ -> <sup>text</sup>
    # ~text~ -> <sub>text</sub>
    # ++text++ -> <ins>text</ins>
    # ==text== -> <mark>text</mark>
    # Standalone images -> <figure> with optional captions
    # Multiple standalone images in one paragraph -> responsive image gallery
    def self.process(content)
      # Only process if content contains HTML or special markers
      return content unless content.include?('<') || content.include?('++') || content.include?('==') || content.include?(':::')
      
      content = process_superscript(content)
      content = process_subscript(content)
      content = process_inserted(content)
      content = process_marked(content)
      content = process_images(content)
      content = process_custom_containers(content)
      content
    end

    def self.process_superscript(content)
      # Handle superscript: ^text^
      # Avoid matching inside code blocks and pre tags
      content.gsub(/(?<!<code)(?<!<pre)(?<!\^)\^([^\^]+?)\^(?!\^)(?!<\/code)(?!<\/pre)/m) do
        "<sup>#{$1}</sup>"
      end
    end

    def self.process_subscript(content)
      # Handle subscript: ~text~
      # Avoid matching inside code blocks
      content.gsub(/(?<!<code)(?<!~)~([^~]+?)~(?!~)(?!<\/code)/m) do
        "<sub>#{$1}</sub>"
      end
    end

    def self.process_inserted(content)
      # Handle inserted text: ++text++
      # Simple pattern that matches ++ ... ++
      content.gsub(/\+\+([^\+\n]+?)\+\+/m, '<ins>\1</ins>')
    end

    def self.process_marked(content)
      # Handle marked/highlighted text: ==text==
      # Simple pattern that matches == ... ==
      content.gsub(/==([^=\n]+?)==/m, '<mark>\1</mark>')
    end

    def self.process_images(content)
      # Convert standalone image paragraphs into figures and galleries.
      content.gsub(/<p>\s*((?:<img\b[^>]*>\s*)+)\s*<\/p>/m) do
        image_tags = Regexp.last_match(1).scan(/<img\b[^>]*>/m)

        if image_tags.length == 1
          build_image_figure(image_tags.first)
        else
          build_image_gallery(image_tags)
        end
      end
    end

    def self.build_image_figure(img_tag)
      caption = img_tag[/\stitle="([^"]*)"/, 1]
      image_html = caption ? img_tag.sub(/\stitle="[^"]*"/, '') : img_tag

      html = %(<figure class="image-figure">#{image_html})
      if caption && !caption.strip.empty?
        html << %(<figcaption>#{caption}</figcaption>)
      end
      html << %(</figure>)
      html
    end

    def self.build_image_gallery(image_tags)
      images = image_tags.map { |img_tag| build_image_figure(img_tag) }.join
      %(<div class="image-gallery image-gallery-cols-#{image_tags.length}">#{images}</div>)
    end

    def self.process_custom_containers(content)
      # Handle custom containers with blockquote syntax: > [!NOTE]
      # Kramdown renders these as:
      # <blockquote>
      #   <p>[!NOTE]
      # Content here</p>
      # </blockquote>
      container_types = %w[NOTE IMPORTANT CAUTION TIP WARNING INFO DANGER SUCCESS]
      
      container_types.each do |type|
        # Match the blockquote pattern with [!TYPE] at the beginning
        pattern = /<blockquote>\s*<p>\s*\[\s*!\s*#{type}\s*\](.*?)<\/p>\s*<\/blockquote>/m
        
        content = content.gsub(pattern) do |match|
          inner_content = $1.strip
          container_class = type.downcase
          "<div class=\"container container-#{container_class}\"><p>#{inner_content}</p></div>"
        end
      end
      
      content
    end
  end

  # Hook to process content after Jekyll renders markdown
  Jekyll::Hooks.register :pages, :post_render do |page|
    page.output = Jekyll::MarkdownEnhanced.process(page.output)
  end

  Jekyll::Hooks.register :documents, :post_render do |document|
    document.output = Jekyll::MarkdownEnhanced.process(document.output)
  end
end

