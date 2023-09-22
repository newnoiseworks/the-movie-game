import React, { useEffect, useRef, useState } from 'react'
import { FormControl, Hide, Input } from '@chakra-ui/react'
import {
  AutoComplete,
  AutoCompleteInput,
  AutoCompleteItem,
  AutoCompleteList,
} from "@choc-ui/chakra-autocomplete";

import { searchForPeople } from '../api'

interface PersonResult {
  id: number
  name: string
}

const GamePeopleSearchInput: React.FC = () => {
  const [peopleSearchResults, setPeopleSearchResults] = useState<PersonResult[]>([])
  const [isLoading, setLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [autoInput, setAutoInput] = useState<string>('')

  const autoCompleteRef = useRef<HTMLInputElement>(null)

  useEffect(function updateSearchQueryAfterResultsAPICall() {
    setAutoInput(searchQuery)
  }, [peopleSearchResults, searchQuery, setAutoInput])

  async function autoCompleteOnChange(value: string) {
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
    setSearchQuery(value)
  }

  return (
    <AutoComplete isLoading={isLoading} defaultIsOpen>
      <Hide>
        <AutoCompleteInput value={autoInput} ref={autoCompleteRef} />
      </Hide>
      <FormControl>
        <Input
          onChange={(e) => autoCompleteOnChange(e.target.value)}
          placeholder="Search for person"
          autoComplete="off"
        />
      </FormControl>
      <AutoCompleteList>
        {peopleSearchResults.map((person) => (
          <AutoCompleteItem value={person.id} key={person.id}>
            {person.name}
          </AutoCompleteItem>
        ))}
      </AutoCompleteList>
    </AutoComplete>
  )
}

export default GamePeopleSearchInput

