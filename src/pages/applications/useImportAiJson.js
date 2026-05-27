const AI_JSON_IMPORT_FIELDS = [
  'vacancyName',
  'recruiterName',
  'organization',
  'vacancyLink',
  'recruiterDmReminderEnabled',
  'note',
]

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)

const isStringValueImportable = (value) => typeof value === 'string' && value.trim() !== ''

const isBooleanValueImportable = (value) => typeof value === 'boolean'

const normalizeImportError = (error) => {
  if (error instanceof Error) return error
  return new Error('Could not import AI JSON.')
}

export const extractJsonFromMarkdown = (rawInput) => {
  const input = String(rawInput ?? '').trim()
  if (!input) {
    throw new Error('Please paste a JSON payload before importing.')
  }

  const fencedMatch = input.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  if (input.includes('```')) {
    throw new Error('Malformed markdown code block. Please close the ``` block and try again.')
  }

  return input
}

export const parseAiJson = (rawInput) => {
  const jsonText = extractJsonFromMarkdown(rawInput)

  let parsed
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error('Invalid JSON format. Please review the payload and try again.')
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON payload must be an object with application fields.')
  }

  return parsed
}

export const mapJsonToForm = (parsedJson, currentForm) => {
  const safeCurrentForm = currentForm ?? {}
  const nextForm = { ...safeCurrentForm }
  const updatedFields = []

  AI_JSON_IMPORT_FIELDS.forEach((fieldName) => {
    if (!hasOwn(parsedJson, fieldName)) return
    const importedValue = parsedJson[fieldName]

    if (fieldName === 'recruiterDmReminderEnabled') {
      if (!isBooleanValueImportable(importedValue)) return
      nextForm[fieldName] = importedValue
      updatedFields.push(fieldName)
      return
    }

    if (!isStringValueImportable(importedValue)) return
    nextForm[fieldName] = importedValue
    updatedFields.push(fieldName)
  })

  return {
    nextForm,
    updatedFields,
  }
}

export const importAiJsonToForm = (rawInput, currentForm) => {
  try {
    const parsedJson = parseAiJson(rawInput)
    return mapJsonToForm(parsedJson, currentForm)
  } catch (error) {
    throw normalizeImportError(error)
  }
}

export const getAiJsonExample = () => `{
  "vacancyName": "Java Developer",
  "recruiterName": "Ana Recruiter",
  "organization": "Acme",
  "vacancyLink": "https://example.com/jobs/java-developer",
  "note": "Strong fit for backend + Spring stack."
}`
