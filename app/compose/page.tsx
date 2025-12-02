'use client'
import { useAioha } from '@aioha/react-ui'
import { Flex, Input, Tag, TagCloseButton, TagLabel, Wrap, WrapItem, Button, useToast } from '@chakra-ui/react'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { generatePermlink, prepareImageArray, validateTitle, validateContent } from '@/lib/utils/composeUtils'

const Editor = dynamic(() => import('./Editor'), { ssr: false })

export default function Home() {
  const [markdown, setMarkdown] = useState("")
  const [title, setTitle] = useState("")
  const [hashtagInput, setHashtagInput] = useState("")
  const [hashtags, setHashtags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { aioha, user } = useAioha()
  const toast = useToast()
  const communityTag = process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || 'blog'

  const handleHashtagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = e
    if (key === " " && hashtagInput.trim()) { // If space is pressed and input is not empty
      setHashtags([...hashtags, hashtagInput.trim()])
      setHashtagInput("") // Clear input field
    } else if (key === "Backspace" && !hashtagInput && hashtags.length) {
      // Remove the last tag if backspace is hit and input is empty
      setHashtags(hashtags.slice(0, -1))
    }
  }

  const removeHashtag = (index: number) => {
    setHashtags(hashtags.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    // Validation
    const titleValidation = validateTitle(title)
    if (!titleValidation.valid) {
      toast({
        title: 'Invalid Title',
        description: titleValidation.error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const contentValidation = validateContent(markdown)
    if (!contentValidation.valid) {
      toast({
        title: 'Invalid Content',
        description: contentValidation.error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!user) {
      toast({
        title: 'Not Logged In',
        description: 'Please log in to publish a post',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Generate Hive-compatible permlink
      const permlink = generatePermlink(title)
      
      // Prepare image array for metadata (first image becomes thumbnail)
      const imageArray = prepareImageArray(markdown)
      
      // Submit to Hive blockchain
      await aioha.comment(
        null, 
        communityTag, 
        permlink, 
        title, 
        markdown, 
        { 
          tags: hashtags, 
          app: 'Snapie.io',
          image: imageArray
        }
      )

      // If we get here, submission was successful
      toast({
        title: 'Success!',
        description: 'Your post has been published',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      // Clear form
      setMarkdown('')
      setTitle('')
      setHashtags([])
      setHashtagInput('')

      // Redirect to post after short delay
      setTimeout(() => {
        window.location.href = `/@${user}/${permlink}`
      }, 1500)
    } catch (error) {
      console.error('Post submission error:', error)
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Failed to publish post',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Flex
      width="100%"
      height={{ base: "calc(100vh - 80px)", md: "100vh" }}
      bg="background"
      justify="center"
      p="1"
      direction="column"
      overflow="hidden"
    >
      {/* Editor */}
      <Flex
        flex="1"
        border="1px solid"
        borderColor="border"
        borderRadius="base"
        justify="center"
        p="1"
        overflow="hidden" // Prevent internal scrolling
      >
        <Editor 
          markdown={markdown} 
          setMarkdown={setMarkdown} 
          title={title} 
          setTitle={setTitle}
          hashtagInput={hashtagInput}
          setHashtagInput={setHashtagInput}
          hashtags={hashtags}
          setHashtags={setHashtags}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </Flex>
    </Flex>
  )
}
