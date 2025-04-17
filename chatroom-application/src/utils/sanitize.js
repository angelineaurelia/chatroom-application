// function to sanitizes a string by removing HTML tags
export default function sanitize(input) {
    if (typeof input !== 'string') return input
    return input.replace(/<[^>]*>?/g, '')
  }