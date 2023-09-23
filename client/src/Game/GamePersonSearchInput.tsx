import React, { useState } from 'react'
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

import { searchForPeople } from '../api'

interface PersonResult {
  id: number
  name: string
}

const GamePeopleSearchInput: React.FC = () => {
  const [peopleSearchResults, setPeopleSearchResults] = useState<PersonResult[]>([])
  const [isLoading, setLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')

  async function autoCompleteOnChange(value: string) {
    setSearchQuery(value)

    if (value.length < 3) {
      setPeopleSearchResults([])
      return
    }

    setLoading(true)

    const searchResults = (await searchForPeople(value)).results.map((result: any) => ({
      id: result.id,
      name: result.name
    }))

    setLoading(false)

    setPeopleSearchResults(searchResults)
  }

  return (
    <Popover 
      isOpen={peopleSearchResults.length > 0}
      placement="bottom"
      autoFocus={false}
      matchWidth
    >
      <PopoverTrigger>
        <FormControl>
          <InputGroup>
            <Input
              placeholder="Search for person"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => autoCompleteOnChange(e.target.value)}
              onBlur={() => setPeopleSearchResults([])}
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
        {peopleSearchResults.map((person) => (
          <div key={person.id} onClick={() => setSearchQuery(person.name)}>
            {person.name}
          </div>
        ))}</PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

export default GamePeopleSearchInput

