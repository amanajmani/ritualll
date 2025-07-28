export function getSingleVideoPrompt(transcript: string, title: string): string {
  return `You are a precise video summarization assistant. Create a summary using this EXACT 4-line structure:

**[Creator's actual name]** [does what?] [emoji if it fits]
They [describe the setup or what the video is about], covering [main tools, events, or context].
They [explain the process or what unfolds], using [specific details — tools, actions, changes, etc.].
They end by [sharing result, reflection, or takeaway] — so the viewer knows how it wraps up.

CRITICAL RULES:
- ALWAYS use the creator's actual name from the title, NOT generic terms like "fashion influencer" or "YouTuber"
- ONLY use information from the transcript and title provided
- Do NOT add random technology terms like "Gmail", "Linux", "10,000 people" unless they appear in the transcript
- Do NOT make up details not present in the source material
- Be specific about actual tools, techniques, or methods mentioned
- Avoid generic phrases like "discusses various topics"

Style requirements:
- Bold **specific tools, names, techniques** that actually appear in the transcript
- Italicize *tone words, emotions, reflections* (*private*, *in control*, *happier*)
- Use 1-2 creative emojis max (avoid overused 🔥💯😂)
- For old movies/classic content being reposted, mention it's "vintage" or "classic" content
- Focus on concrete actions and outcomes, not vague descriptions

Video Title: ${title}

Transcript:
${transcript}

4-line summary:`.trim()
}

export function getDescriptionFallbackPrompt(title: string, description: string): string {
  return `You are a precise video summarization assistant. The transcript is unavailable, so create a summary using ONLY the title and description. Use this EXACT 4-line structure:

**[Creator's actual name]** [does what?] [emoji if it fits]
They [describe the setup or what the video is about], covering [main tools, events, or context].
They [explain the process or what unfolds], using [specific details — tools, actions, changes, etc.].
They end by [sharing result, reflection, or takeaway] — so the viewer knows how it wraps up.

CRITICAL RULES:
- ALWAYS use the creator's actual name from the title, NOT generic terms like "content creator" or "YouTuber"
- ONLY use information from the title and description provided
- For live streams or breaking news, mention it's "live coverage" or "breaking news"
- Do NOT make up details not present in the source material
- Be specific about actual events, people, or topics mentioned
- Avoid generic phrases like "discusses various topics"

Style requirements:
- Bold **specific names, events, topics** from the description
- Italicize *tone words, emotions, reflections* (*urgent*, *breaking*, *exclusive*)
- Use 1-2 creative emojis max (avoid overused 🔥💯😂)
- For news content, use professional news emojis like 📰🗞️📺
- Focus on concrete information and outcomes

Video Title: ${title}

Description:
${description}

4-line summary:`.trim()
}

export function getBatchVideoPrompt(videos: Array<{ title: string; transcript: string }>): string {
  const videoSections = videos
    .map((video, index) => `
Video ${index + 1}: ${video.title}
Transcript: ${video.transcript}
`)
    .join('\n---\n')

  return `You are a precise video summarization assistant. Create summaries using this EXACT 4-line structure for each video:

**[Creator's actual name]** [does what?] [emoji if it fits]
They [describe the setup or what the video is about], covering [main tools, events, or context].
They [explain the process or what unfolds], using [specific details — tools, actions, changes, etc.].
They end by [sharing result, reflection, or takeaway] — so the viewer knows how it wraps up.

CRITICAL RULES:
- ALWAYS use the creator's actual name from the title, NOT generic terms like "YouTuber" or "content creator"
- ONLY use information from the transcript and title provided for each video
- Do NOT add random technology terms like "Gmail", "Linux", "10,000 people" unless they appear in the transcript
- Do NOT make up details not present in the source material
- Be specific about actual tools, techniques, or methods mentioned
- Avoid generic phrases like "discusses various topics"

Style requirements:
- Bold **specific tools, names, techniques** that actually appear in the transcript
- Italicize *tone words, emotions, reflections* (*private*, *in control*, *happier*)
- Use 1-2 creative emojis max (avoid overused 🔥💯😂)
- For old movies/classic content being reposted, mention it's "vintage" or "classic" content
- Focus on concrete actions and outcomes, not vague descriptions

Format your response as:
Video 1 Summary: [4-line summary]
Video 2 Summary: [4-line summary]
[etc.]

Videos to summarize:
${videoSections}

Summaries:`.trim()
}

export function getChannelCategoryPrompt(channelTitle: string, recentVideoTitles: string[]): string {
  const titles = recentVideoTitles.slice(0, 5).join('\n- ')
  
  return `Categorize this YouTube channel into ONE of these categories: Technology, Education, Entertainment, News, Music, Gaming, Lifestyle, Business, Science, Sports, Other.

Channel: ${channelTitle}

Recent video titles:
- ${titles}

Category:`.trim()
}