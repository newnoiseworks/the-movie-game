import { useRef, useState, forwardRef, useImperativeHandle } from 'react'
import {
  FormControl,
  Popover,
  PopoverContent,
  PopoverBody,
  PopoverTrigger,
  Spinner,
  Input,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react'

interface SearchResult {
  id: number
  name: string
}

export interface GameSearchInputRef {
  clearInput: () => void
}

interface GameSearchInputProps {
  searchFn: (s: string) => Promise<{ results: SearchResult[] }>
  setIdFn: (id: number) => void
  placeholder: string
}

const GameSearchInput: React.ForwardRefRenderFunction<
  GameSearchInputRef, GameSearchInputProps
> = ({
  placeholder, searchFn, setIdFn
}, ref) => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setLoading] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function autoCompleteOnChange(value: string) {
    if (inputRef.current) {
      inputRef.current.value = value
    }

    if (value.length < 3) {
      setSearchResults([])
      return
    }

    setLoading(true)

    const _searchResults = (await searchFn(value)).results.map((result: any) => ({
      id: result.id,
      name: result.name
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
        <FormControl>
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
        </FormControl>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverBody>
        {searchResults.map((result) => (
          <div
            key={result.id}
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.value = result.name
              }

              setSearchResults([])
              setIdFn(result.id)
            }}
          >
            {result.name}
          </div>
        ))}</PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

export default forwardRef(GameSearchInput)

