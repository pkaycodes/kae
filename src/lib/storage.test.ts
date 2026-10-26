import { describe, expect, it } from 'vitest'
import { createSampleDb } from '../data/sample'
import {
  APP_ID,
  STORAGE_KEY,
  loadDb,
  normaliseDatabase,
  parseBackup,
  saveDb,
  serializeBackup,
} from './storage'

describe('backups', () => {
  it('round-trips a database', () => {
    const sample = createSampleDb()
    const restored = parseBackup(serializeBackup(sample))
    expect(restored).toEqual(sample)
  })

  it('accepts a raw database as well as an exported wrapper', () => {
    const sample = createSampleDb()
    expect(normaliseDatabase(JSON.parse(JSON.stringify(sample)))).toEqual(sample)
    const wrapped = JSON.parse(serializeBackup(sample))
    expect(wrapped.app).toBe(APP_ID)
    expect(parseBackup(JSON.stringify(wrapped))).toEqual(sample)
  })

  it('rejects invalid JSON and unsupported versions', () => {
    expect(() => parseBackup('{nope')).toThrow(/valid JSON/)
    const sample = JSON.parse(serializeBackup(createSampleDb()))
    sample.data.version = 2
    expect(() => parseBackup(JSON.stringify(sample))).toThrow(/unsupported version/)
  })

  it('rejects orphaned entries and duplicate ids', () => {
    const sample = JSON.parse(serializeBackup(createSampleDb()))
    sample.data.entries[0].customerId = 'missing'
    expect(() => parseBackup(JSON.stringify(sample))).toThrow(/does not exist/)

    const duplicate = JSON.parse(serializeBackup(createSampleDb()))
    duplicate.data.customers.push(duplicate.data.customers[0])
    expect(() => parseBackup(JSON.stringify(duplicate))).toThrow(/duplicate customer/)
  })

  it('rejects invalid amounts and dates', () => {
    const badAmount = JSON.parse(serializeBackup(createSampleDb()))
    badAmount.data.entries[0].amountMinor = -20
    expect(() => parseBackup(JSON.stringify(badAmount))).toThrow(/invalid amount/)

    const badDate = JSON.parse(serializeBackup(createSampleDb()))
    badDate.data.entries[0].date = '26/10/2026'
    expect(() => parseBackup(JSON.stringify(badDate))).toThrow(/invalid date/)
  })
})

describe('local storage', () => {
  it('saves and loads the ledger', () => {
    const sample = createSampleDb()
    saveDb(sample)
    expect(loadDb()).toEqual(sample)
  })

  it('returns null instead of crashing on corrupt storage', () => {
    localStorage.setItem(STORAGE_KEY, '{broken')
    expect(loadDb()).toBeNull()
  })

  it('returns null when nothing has been saved', () => {
    expect(loadDb()).toBeNull()
  })
})
