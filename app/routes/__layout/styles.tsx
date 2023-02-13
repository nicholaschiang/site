import { Link, useLoaderData } from '@remix-run/react'
import type { LoaderFunction } from '@remix-run/node'
import type { Style } from '@prisma/client'
import { json } from '@remix-run/node'
import { nanoid } from 'nanoid'

import { FILTER_PARAM, filterToSearchParam } from 'filters'
import type { Filter } from 'filters'
import { log } from 'log.server'
import { prisma } from 'db.server'

export type LoaderData = Style[]

export const loader: LoaderFunction = async () => {
  log.debug('getting styles...')
  const styles = await prisma.style.findMany()
  log.debug('got %d styles', styles.length)
  return json<LoaderData>(styles)
}

export default function StylesPage() {
  const styles = useLoaderData<LoaderData>()
  return (
    <main className='flex flex-1 items-center justify-center px-12'>
      <h1 className='my-4 mr-12 text-6xl'>styles</h1>
      <ul>
        {styles.map((style) => {
          const filter: Filter<'styles', 'some'> = {
            id: nanoid(5),
            name: 'styles',
            condition: 'some',
            value: { id: style.id, name: style.name },
          }
          const param = filterToSearchParam(filter)
          return (
            <li key={style.id}>
              <Link
                prefetch='intent'
                className='link underline'
                to={`/products?${FILTER_PARAM}=${encodeURIComponent(param)}`}
              >
                {style.name}
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
