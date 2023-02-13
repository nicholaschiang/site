import { Link, useLoaderData } from '@remix-run/react'
import type { LoaderFunction } from '@remix-run/node'
import type { Size } from '@prisma/client'
import { json } from '@remix-run/node'
import { nanoid } from 'nanoid'

import { FILTER_PARAM, filterToSearchParam } from 'filters'
import type { Filter } from 'filters'
import { log } from 'log.server'
import { prisma } from 'db.server'

export type LoaderData = Size[]

export const loader: LoaderFunction = async () => {
  log.debug('getting sizes...')
  const sizes = await prisma.size.findMany()
  log.debug('got %d sizes', sizes.length)
  return json<LoaderData>(sizes)
}

export default function SizesPage() {
  const sizes = useLoaderData<LoaderData>()
  return (
    <main className='flex flex-1 items-center justify-center px-12'>
      <h1 className='my-4 mr-12 text-6xl'>sizes</h1>
      <ul>
        {sizes.map((size) => {
          const filter: Filter<'sizes', 'some'> = {
            id: nanoid(5),
            name: 'sizes',
            condition: 'some',
            value: { id: size.id, name: size.name },
          }
          const param = filterToSearchParam(filter)
          return (
            <li key={size.id}>
              <Link
                prefetch='intent'
                className='link underline'
                to={`/products?${FILTER_PARAM}=${encodeURIComponent(param)}`}
              >
                {size.name}
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
