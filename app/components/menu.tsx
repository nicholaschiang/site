import * as Checkbox from '@radix-ui/react-checkbox'
import * as Portal from '@radix-ui/react-portal'
import type { Dispatch, SetStateAction } from 'react'
import { useMemo, useRef, useState } from 'react'
import { CheckIcon } from '@radix-ui/react-icons'
import { Key } from 'ts-key-enum'
import cn from 'classnames'
import { nanoid } from 'nanoid'
import { useHotkeys } from 'react-hotkeys-hook'

import { Hotkey } from 'components/hotkey'

type MenuItemProps = {
  label: string
  checked?: boolean | 'indeterminate'
  setChecked?(checked: boolean | 'indeterminate'): void
  onClick?(): void
}

function MenuItem({ label, checked, setChecked, onClick }: MenuItemProps) {
  return (
    <li
      role='option'
      aria-selected={typeof checked === 'boolean' ? checked : undefined}
      tabIndex={0}
      onClick={() => {
        if (setChecked) setChecked(!checked)
        if (onClick) onClick()
      }}
      onKeyDown={(event) => {
        if (event.key === Key.Enter) {
          if (setChecked) setChecked(!checked)
          if (onClick) onClick()
          event.preventDefault()
          event.stopPropagation()
        }
      }}
      className='relative flex h-8 w-full min-w-min max-w-xl cursor-pointer items-center text-ellipsis whitespace-nowrap focus:after:absolute focus:after:inset-y-0 focus:after:inset-x-1 focus:after:-z-10 focus:after:rounded-md focus:after:bg-gray-400/10 focus:after:dark:bg-gray-500/10'
    >
      <div className='flex h-full flex-1 items-center overflow-hidden px-3.5'>
        {setChecked && (
          <Checkbox.Root
            tabIndex={-1}
            checked={checked}
            onCheckedChange={setChecked}
            className={cn(
              'mr-3 flex h-3.5 w-3.5 appearance-none items-center justify-center rounded-sm border p-0.5 outline-none transition-colors',
              !checked &&
                'border-gray-500/50 bg-transparent dark:border-gray-400/50',
              checked && 'border-indigo-500 bg-indigo-500 text-white',
            )}
          >
            <Checkbox.Indicator
              forceMount
              className={cn(
                'transition-opacity',
                checked ? 'opacity-100' : 'opacity-0',
              )}
            >
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
        )}
        {label}
      </div>
    </li>
  )
}

export type MenuProps = {
  position: { top: number; left: number }
  setOpen: Dispatch<SetStateAction<boolean>>
  placeholder: string
  hotkey?: string
  items: MenuItemProps[]
}

export function Menu({
  position,
  setOpen,
  placeholder,
  hotkey,
  items,
}: MenuProps) {
  const [filter, setFilter] = useState('')
  const results = useMemo(
    () =>
      items.filter(({ label }) =>
        label.toLowerCase().includes(filter.toLowerCase().trim()),
      ),
    [items, filter],
  )
  const menuId = useRef(nanoid())
  useHotkeys<HTMLInputElement>(
    'esc',
    (event) => {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    },
    [setOpen],
  )
  return (
    <Portal.Root>
      <div
        tabIndex={-1}
        role='button'
        aria-label='Close Menu'
        onClick={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === Key.Enter) {
            setOpen(false)
            event.preventDefault()
            event.stopPropagation()
          }
        }}
        className='fixed inset-0 z-30 flex cursor-default items-start justify-center'
      />
      <div
        className='frosted fixed z-40 mt-0.5 flex min-w-min max-w-xl origin-top-left flex-col overflow-hidden rounded-lg border border-gray-200 text-xs shadow-xl will-change-transform dark:border-gray-700'
        style={position}
      >
        <div
          className={cn(
            'flex items-center border-gray-200 dark:border-gray-700',
            results.length && 'border-b',
          )}
        >
          <input
            ref={(input) => input?.focus()}
            role='combobox'
            aria-expanded
            aria-controls={menuId.current}
            className='flex-1 appearance-none bg-transparent px-3.5 pt-2.5 pb-2 outline-none placeholder:text-gray-500/50 dark:placeholder:text-gray-400/50'
            type='text'
            placeholder={placeholder}
            spellCheck='false'
            autoComplete='off'
            value={filter}
            onChange={(event) => setFilter(event.currentTarget.value)}
            onKeyDownCapture={(event) => {
              if (event.key === Key.Escape) {
                event.preventDefault()
                event.stopPropagation()
                setOpen(false)
              }
            }}
          />
          {hotkey && <Hotkey className='mr-3.5'>{hotkey}</Hotkey>}
        </div>
        <ul
          role='listbox'
          id={menuId.current}
          className={cn(results.length && 'py-1')}
        >
          {results.map((result) => (
            <MenuItem {...result} key={result.label} />
          ))}
        </ul>
      </div>
    </Portal.Root>
  )
}
