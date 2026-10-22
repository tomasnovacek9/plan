import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
export function createTestDatabase(){
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_shared_plan.sql',import.meta.url),'utf8'));
  const db={
    prepare(sql){return {values:[],bind(...values){this.values=values;return this;},async first(){return sqlite.prepare(sql).get(...this.values)||null;},execute(){const result=sqlite.prepare(sql).run(...this.values);return {success:true,meta:{changes:Number(result.changes)}};}};},
    async batch(statements){sqlite.exec('BEGIN');try{const result=statements.map(statement=>statement.execute());sqlite.exec('COMMIT');return result;}catch(error){sqlite.exec('ROLLBACK');throw error;}},
    withSession(){return db;}
  };
  return {db,sqlite};
}
