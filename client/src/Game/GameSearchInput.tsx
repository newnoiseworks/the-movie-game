import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import {
  FormControl,
  FormErrorMessage,
  Popover,
  PopoverContent,
  PopoverBody,
  PopoverTrigger,
  Spinner,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Text
} from '@chakra-ui/react'

interface SearchResult {
  id: number
  name: string
  photo: string
}

export interface GameSearchInputRef {
  clearInput: () => void
}

export interface GameSearchInputProps {
  searchFn: (s: string) => Promise<{ results: SearchResult[] }>
  setIdFn: (id: number) => void
  placeholder: string
  errorMessage?: string
  "data-testid"?: string
}

const GameSearchInput: React.ForwardRefRenderFunction<
  GameSearchInputRef, GameSearchInputProps
> = ({
  placeholder,
  searchFn,
  setIdFn,
  errorMessage,
  ...props
}, ref) => {

  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setLoading] = useState<boolean>(false)
  const [currentError, setCurrentError] = useState<string>()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (errorMessage) {
      setCurrentError(errorMessage)
    }
  }, [errorMessage])

  async function autoCompleteOnChange(value: string) {
    if (inputRef.current) {
      inputRef.current.value = value
    }

    setCurrentError(undefined)

    if (value.length < 3) {
      setSearchResults([])
      return
    }

    setLoading(true)

    const _searchResults = (await searchFn(value)).results.map((result: any) => ({
      id: result.id,
      name: result.name,
      photo: result.profile_path || result.poster_path
    }))

    setLoading(false)

    setSearchResults(_searchResults)
  }

  useImperativeHandle(ref, () => ({
    clearInput: () => {
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }))

  return (
    <Popover 
      isOpen={searchResults.length > 0}
      placement="bottom"
      autoFocus={false}
      matchWidth
    >
      <PopoverTrigger>
        <FormControl isInvalid={!!currentError}>
          <InputGroup>
            <Input
              placeholder={placeholder}
              autoComplete="off"
              ref={inputRef}
              onChange={(e) => autoCompleteOnChange(e.target.value)}
            />
            {isLoading &&
              <InputRightElement>
                <Spinner />
              </InputRightElement>
            }
          </InputGroup>
          {currentError && <FormErrorMessage>
            {currentError}
          </FormErrorMessage>}
        </FormControl>
      </PopoverTrigger>
      <PopoverContent data-testid={props["data-testid"]}>
        <PopoverBody>
        {searchResults.map((result) => (
          <HStack
            key={result.id}
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.value = result.name
              }

              setSearchResults([])
              setIdFn(result.id)
            }}
          >
            {
              result.photo &&
              <img
                src={`https://image.tmdb.org/t/p/w500/${result.photo}`}
                width={50}
                alt={result.name}
              />
            }
            <Text>{result.name}</Text>
          </HStack>
        ))}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

export default forwardRef(GameSearchInput)

