import React, { Children, useState, useEffect } from 'react'
import PropTypes from 'prop-types'

import { getSuggestionHtmlId } from './utils'
import Suggestion from './Suggestion'
import LoadingIndicator from './LoadingIndicator'

function SuggestionsOverlay({
  id,
  suggestions = {},
  a11ySuggestionsListLabel,
  focusIndex,
  scrollFocusedIntoView,
  isLoading,
  isOpened,
  onSelect = () => null,
  ignoreAccents,
  containerRef,
  children,
  customSuggestionsContainer,
  onMouseDown,
  onMouseEnter,
}) {
  const [ulElement, setUlElement] = useState(undefined)

  useEffect(() => {
    if (
      !ulElement ||
      ulElement.offsetHeight >= ulElement.scrollHeight ||
      !scrollFocusedIntoView
    ) {
      return
    }
    const scrollTop = ulElement.scrollTop

    let { top, bottom } = ulElement.children[focusIndex].getBoundingClientRect()
    const { top: topContainer } = ulElement.getBoundingClientRect()
    top = top - topContainer + scrollTop
    bottom = bottom - topContainer + scrollTop

    if (top < scrollTop) {
      ulElement.scrollTop = top
    } else if (bottom > ulElement.offsetHeight) {
      ulElement.scrollTop = bottom - ulElement.offsetHeight
    }
  }, [focusIndex, scrollFocusedIntoView, ulElement])

  const renderSuggestions = () => {
    const suggestionsToRender = (
      <ul
        ref={setUlElement}
        id={id}
        role="listbox"
        aria-label={a11ySuggestionsListLabel}
      >
        {Object.values(suggestions).reduce(
          (accResults, { results, queryInfo }) => [
            ...accResults,
            ...results.map((result, index) =>
              renderSuggestion(result, queryInfo, accResults.length + index)
            ),
          ],
          []
        )}
      </ul>
    )

    if (customSuggestionsContainer)
      return customSuggestionsContainer(suggestionsToRender)
    return suggestionsToRender
  }

  const renderSuggestion = (result, queryInfo, index) => {
    const isFocused = index === focusIndex
    const { childIndex, query } = queryInfo
    const { renderSuggestion } = Children.toArray(children)[childIndex].props

    return (
      <Suggestion
        key={`${childIndex}-${getID(result)}`}
        id={getSuggestionHtmlId(id, index)}
        query={query}
        index={index}
        ignoreAccents={ignoreAccents}
        renderSuggestion={renderSuggestion}
        suggestion={result}
        focused={isFocused}
        onClick={() => select(result, queryInfo)}
        onMouseEnter={() => handleMouseEnter(index)}
      />
    )
  }

  const renderLoadingIndicator = () => {
    if (!isLoading) {
      return
    }

    return <LoadingIndicator />
  }

  const handleMouseEnter = (index, ev) => {
    if (onMouseEnter) {
      onMouseEnter(index)
    }
  }

  const select = (suggestion, queryInfo) => {
    onSelect(suggestion, queryInfo)
  }

  const getID = (suggestion) => {
    if (typeof suggestion === 'string') {
      return suggestion
    }
    return suggestion.id
  }

  if (!isOpened) {
    return null
  }

  return (
    <div
      className='w-full theme-bg-surface theme-border theme-text border rounded-md shadow-sm'
      onMouseDown={onMouseDown}
      ref={containerRef}
    >
      {renderSuggestions()}
      {renderLoadingIndicator()}
    </div>
  )
}

SuggestionsOverlay.propTypes = {
  id: PropTypes.string.isRequired,
  suggestions: PropTypes.object.isRequired,
  a11ySuggestionsListLabel: PropTypes.string,
  focusIndex: PropTypes.number,
  position: PropTypes.string,
  left: PropTypes.number,
  right: PropTypes.number,
  top: PropTypes.number,
  scrollFocusedIntoView: PropTypes.bool,
  isLoading: PropTypes.bool,
  isOpened: PropTypes.bool.isRequired,
  onSelect: PropTypes.func,
  ignoreAccents: PropTypes.bool,
  customSuggestionsContainer: PropTypes.func,
  containerRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({
      current:
        typeof Element === 'undefined'
          ? PropTypes.any
          : PropTypes.instanceOf(Element),
    }),
  ]),
}

export default SuggestionsOverlay;
